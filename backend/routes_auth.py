"""Authentication routes — signup, login, profile."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, PAYMENT_METHODS
from backend.schemas import SignupRequest, LoginRequest, AuthResponse, UserOut, UserUpdate
from backend.auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

_PALETTE = ["#5B8DEF", "#22C55E", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"]


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "An account with that email already exists")
    if data.role not in ("rider", "driver", "both"):
        raise HTTPException(400, "Invalid role")

    color = _PALETTE[db.query(User).count() % len(_PALETTE)]
    user = User(
        name=data.name.strip() or "Rider",
        email=email,
        phone=data.phone.strip(),
        password_hash=hash_password(data.password),
        role=data.role,
        avatar_color=color,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(token=create_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return AuthResponse(token=create_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = data.model_dump(exclude_unset=True)
    if "default_payment_method" in payload and payload["default_payment_method"] not in PAYMENT_METHODS:
        raise HTTPException(400, "Unsupported payment method")
    if "role" in payload and payload["role"] not in ("rider", "driver", "both"):
        raise HTTPException(400, "Invalid role")
    for k, v in payload.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user
