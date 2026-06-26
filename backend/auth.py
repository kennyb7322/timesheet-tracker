"""Lightweight auth: PBKDF2 password hashing + HMAC-signed bearer tokens.

No external dependencies — stdlib only. Tokens are stateless: they encode the
user id and are signed with a server secret, so no session table is needed.
"""
import os
import hmac
import base64
import hashlib
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User

# In production set UCS_SECRET; the default keeps local/dev usable out of the box.
SECRET = os.environ.get("UCS_SECRET", "ucs-rides-dev-secret-change-me").encode()


# ── Passwords ──────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_b64, dk_b64 = stored.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(dk_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


# ── Tokens ─────────────────────────────────────────────────────────────────
def create_token(user_id: int) -> str:
    payload = str(user_id).encode()
    sig = hmac.new(SECRET, payload, hashlib.sha256).digest()
    raw = payload + b"." + base64.urlsafe_b64encode(sig)
    return base64.urlsafe_b64encode(raw).decode()


def _decode_token(token: str) -> int:
    try:
        raw = base64.urlsafe_b64decode(token.encode())
        payload, sig_b64 = raw.split(b".", 1)
        expected = hmac.new(SECRET, payload, hashlib.sha256).digest()
        if not hmac.compare_digest(base64.urlsafe_b64decode(sig_b64), expected):
            raise ValueError("bad signature")
        return int(payload.decode())
    except Exception:
        raise HTTPException(401, "Invalid or expired token")


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    user_id = _decode_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user
