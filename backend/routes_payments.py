"""Payment routes — supported methods and history."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import User, Payment, PAYMENT_METHODS
from backend.schemas import PaymentOut
from backend.auth import get_current_user
from backend.fares import PAYMENT_LABELS, PAYMENT_HANDLES

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/methods")
def methods():
    """List the payment options the platform supports, with display metadata."""
    out = []
    for m in PAYMENT_METHODS:
        out.append({
            "method": m,
            "label": PAYMENT_LABELS.get(m, m.title()),
            "handle": PAYMENT_HANDLES.get(m, ""),
            "instant": m in ("cashapp", "venmo", "paypal", "stripe"),
        })
    return out


@router.get("/history", response_model=List[PaymentOut])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (db.query(Payment)
            .filter(Payment.user_id == user.id)
            .order_by(Payment.created_at.desc())
            .limit(100).all())
