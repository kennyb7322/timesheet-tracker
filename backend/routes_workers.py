"""Worker management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Worker
from backend.schemas import WorkerCreate, WorkerUpdate, WorkerOut

router = APIRouter(prefix="/api/workers", tags=["workers"])


@router.get("/", response_model=List[WorkerOut])
def list_workers(active_only: bool = True, db: Session = Depends(get_db)):
    q = db.query(Worker)
    if active_only:
        q = q.filter(Worker.is_active == 1)
    return q.order_by(Worker.name).all()


@router.post("/", response_model=WorkerOut, status_code=201)
def create_worker(data: WorkerCreate, db: Session = Depends(get_db)):
    existing = db.query(Worker).filter(Worker.name == data.name).first()
    if existing:
        raise HTTPException(400, "Worker with this name already exists")
    worker = Worker(**data.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.put("/{worker_id}", response_model=WorkerOut)
def update_worker(worker_id: int, data: WorkerUpdate, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(worker, k, v)
    db.commit()
    db.refresh(worker)
    return worker


@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")
    worker.is_active = 0
    db.commit()
    return {"ok": True}
