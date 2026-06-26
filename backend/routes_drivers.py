"""Driver routes — online toggle, location, vehicle management, earnings."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.database import get_db
from backend.models import User, Vehicle, Ride
from backend.schemas import VehicleCreate, VehicleOut
from backend.auth import get_current_user

router = APIRouter(prefix="/api/drivers", tags=["drivers"])


class OnlineToggle(BaseModel):
    is_online: bool
    lat: Optional[float] = None
    lng: Optional[float] = None


@router.post("/online")
def set_online(data: OnlineToggle, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("driver", "both"):
        raise HTTPException(403, "Switch your account to driver mode first")
    user.is_online = data.is_online
    if data.lat is not None:
        user.current_lat = data.lat
    if data.lng is not None:
        user.current_lng = data.lng
    db.commit()
    return {"is_online": user.is_online, "lat": user.current_lat, "lng": user.current_lng}


@router.get("/vehicles", response_model=List[VehicleOut])
def my_vehicles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Vehicle).filter(Vehicle.driver_id == user.id).all()


@router.post("/vehicles", response_model=VehicleOut, status_code=201)
def add_vehicle(data: VehicleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.driver_id == user.id).count()
    v = Vehicle(driver_id=user.id, is_default=(existing == 0), **data.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.driver_id == user.id).first()
    if not v:
        raise HTTPException(404, "Vehicle not found")
    db.delete(v)
    db.commit()
    return {"ok": True}


@router.get("/earnings")
def earnings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rides = db.query(Ride).filter(Ride.driver_id == user.id, Ride.status == "completed").all()
    total = sum(r.final_fare or r.fare_estimate for r in rides)
    # Platform keeps a 15% service fee; driver take-home is the remainder.
    take_home = round(total * 0.85, 2)
    return {
        "completed_trips": len(rides),
        "gross": round(total, 2),
        "service_fee": round(total * 0.15, 2),
        "take_home": take_home,
    }
