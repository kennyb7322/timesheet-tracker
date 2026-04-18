"""SQLAlchemy models for timesheet tracking."""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
from backend.database import Base


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    role = Column(String, default="")
    phone = Column(String, default="")
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, default="")
    location = Column(String, default="")
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    time_entries = relationship("TimeEntry", back_populates="project")
    expenses = relationship("Expense", back_populates="project")


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    worker_name = Column(String, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    hours = Column(Float, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_description = Column(String, default="")
    overtime = Column(Float, default=0.0)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="time_entries")


EXPENSE_CATEGORIES = [
    "Materials", "Gas/Fuel", "Tools", "Equipment Rental",
    "Permits", "Subcontractor", "Food/Meals", "Other",
]

EXPENSE_STORES = [
    "Home Depot", "Lowe's", "Menards", "Harbor Freight",
    "Shell", "Chevron", "BP", "Costco", "Walmart", "Other",
]


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    worker_name = Column(String, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, default="Materials")
    store = Column(String, default="")
    description = Column(String, default="")
    receipt_ref = Column(String, default="")  # receipt number or reference
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="expenses")
