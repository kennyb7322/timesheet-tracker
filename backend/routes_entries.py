"""Time entry routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from backend.database import get_db
from backend.models import TimeEntry, Project
from backend.schemas import TimeEntryCreate, TimeEntryUpdate, TimeEntryOut

router = APIRouter(prefix="/api/entries", tags=["entries"])


@router.get("/", response_model=List[TimeEntryOut])
def list_entries(
    worker_name: Optional[str] = None,
    project_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(TimeEntry).options(joinedload(TimeEntry.project))
    if worker_name:
        q = q.filter(TimeEntry.worker_name == worker_name)
    if project_id:
        q = q.filter(TimeEntry.project_id == project_id)
    if start_date:
        q = q.filter(TimeEntry.date >= start_date)
    if end_date:
        q = q.filter(TimeEntry.date <= end_date)
    return q.order_by(TimeEntry.date.desc()).limit(limit).all()


@router.post("/", response_model=TimeEntryOut, status_code=201)
def create_entry(data: TimeEntryCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(400, "Project not found")
    entry = TimeEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return db.query(TimeEntry).options(joinedload(TimeEntry.project)).filter(TimeEntry.id == entry.id).first()


@router.put("/{entry_id}", response_model=TimeEntryOut)
def update_entry(entry_id: int, data: TimeEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return db.query(TimeEntry).options(joinedload(TimeEntry.project)).filter(TimeEntry.id == entry.id).first()


@router.delete("/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
