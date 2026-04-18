"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel
from datetime import date
from typing import Optional


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
