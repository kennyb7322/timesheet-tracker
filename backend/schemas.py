"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel
from datetime import date
from typing import Optional


# --- Worker schemas ---
class WorkerCreate(BaseModel):
    name: str
    role: str = ""
    phone: str = ""


class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[int] = None


class WorkerOut(BaseModel):
    id: int
    name: str
    role: str
    phone: str
    is_active: int

    class Config:
        from_attributes = True


# --- Project schemas ---
class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    location: str = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[int] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    location: str
    is_active: int

    class Config:
        from_attributes = True


# --- TimeEntry schemas ---
class TimeEntryCreate(BaseModel):
    worker_name: str
    date: date
    hours: float
    project_id: int
    task_description: str = ""
    overtime: float = 0.0
    notes: str = ""


class TimeEntryUpdate(BaseModel):
    worker_name: Optional[str] = None
    date: Optional[date] = None
    hours: Optional[float] = None
    project_id: Optional[int] = None
    task_description: Optional[str] = None
    overtime: Optional[float] = None
    notes: Optional[str] = None


class TimeEntryOut(BaseModel):
    id: int
    worker_name: str
    date: date
    hours: float
    project_id: int
    task_description: str
    overtime: float
    notes: str
    project: ProjectOut

    class Config:
        from_attributes = True


# --- Expense schemas ---
class ExpenseCreate(BaseModel):
    worker_name: str
    date: date
    project_id: int
    amount: float
    category: str = "Materials"
    store: str = ""
    description: str = ""
    receipt_ref: str = ""
    notes: str = ""


class ExpenseUpdate(BaseModel):
    worker_name: Optional[str] = None
    date: Optional[date] = None
    project_id: Optional[int] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    store: Optional[str] = None
    description: Optional[str] = None
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None


class ExpenseOut(BaseModel):
    id: int
    worker_name: str
    date: date
    project_id: int
    amount: float
    category: str
    store: str
    description: str
    receipt_ref: str
    notes: str
    project: ProjectOut

    class Config:
        from_attributes = True
