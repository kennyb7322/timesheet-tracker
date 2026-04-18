"""Expense tracking routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from backend.database import get_db
from backend.models import Expense, Project, EXPENSE_CATEGORIES, EXPENSE_STORES
from backend.schemas import ExpenseCreate, ExpenseUpdate, ExpenseOut

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/categories")
def get_categories():
    return {"categories": EXPENSE_CATEGORIES, "stores": EXPENSE_STORES}


@router.get("/", response_model=List[ExpenseOut])
def list_expenses(
    worker_name: Optional[str] = None,
    project_id: Optional[int] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(Expense).options(joinedload(Expense.project))
    if worker_name:
        q = q.filter(Expense.worker_name == worker_name)
    if project_id:
        q = q.filter(Expense.project_id == project_id)
    if category:
        q = q.filter(Expense.category == category)
    if start_date:
        q = q.filter(Expense.date >= start_date)
    if end_date:
        q = q.filter(Expense.date <= end_date)
    return q.order_by(Expense.date.desc()).limit(limit).all()


@router.post("/", response_model=ExpenseOut, status_code=201)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(400, "Project not found")
    expense = Expense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return db.query(Expense).options(joinedload(Expense.project)).filter(Expense.id == expense.id).first()


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(expense, k, v)
    db.commit()
    db.refresh(expense)
    return db.query(Expense).options(joinedload(Expense.project)).filter(Expense.id == expense.id).first()


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(404, "Expense not found")
    db.delete(expense)
    db.commit()
    return {"ok": True}
