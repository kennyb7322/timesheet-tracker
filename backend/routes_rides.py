"""Ride routes — quotes, requests, driver matching, lifecycle, payments."""
import json
import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import User, Ride, Vehicle, Payment
from backend.schemas import (
    QuoteRequest, RideCreate, RideOut, StatusUpdate, DriverMini, VehicleOut, UserOut, Stop,
)
from backend.auth import get_current_user
from backend.fares import estimate_fare, payment_instructions, TIERS

router = APIRouter(prefix="/api/rides", tags=["rides"])


# ── helpers ──────────────────────────────────────────────────────────────
def haversine_miles(lat1, lng1, lat2, lng2):
    R = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _driver_mini(db: Session, driver_id: Optional[int]) -> Optional[DriverMini]:
    if not driver_id:
        return None
    d = db.query(User).filter(User.id == driver_id).first()
    if not d:
        return None
    veh = db.query(Vehicle).filter(Vehicle.driver_id == d.id).first()
    return DriverMini(
        id=d.id, name=d.name, rating=d.rating, avatar_color=d.avatar_color,
        current_lat=d.current_lat, current_lng=d.current_lng, hourly_rate=d.hourly_rate,
        vehicle=VehicleOut.model_validate(veh) if veh else None,
    )


def serialize_ride(db: Session, r: Ride, include_rider=False) -> RideOut:
    try:
        stops = [Stop(**s) for s in json.loads(r.stops or "[]")]
    except Exception:
        stops = []
    try:
        preferences = json.loads(getattr(r, "preferences", None) or "[]")
    except Exception:
        preferences = []
    out = RideOut(
        id=r.id, rider_id=r.rider_id, driver_id=r.driver_id, mode=r.mode, tier=r.tier,
        pickup_address=r.pickup_address, pickup_lat=r.pickup_lat, pickup_lng=r.pickup_lng,
        dropoff_address=r.dropoff_address, dropoff_lat=r.dropoff_lat, dropoff_lng=r.dropoff_lng,
        stops=stops, preferences=preferences, scheduled_time=r.scheduled_time, duration_hours=r.duration_hours,
        distance_miles=r.distance_miles, passengers=r.passengers, notes=r.notes,
        status=r.status, fare_estimate=r.fare_estimate, final_fare=r.final_fare,
        payment_method=r.payment_method, payment_status=r.payment_status, created_at=r.created_at,
        driver=_driver_mini(db, r.driver_id),
    )
    if include_rider:
        rider = db.query(User).filter(User.id == r.rider_id).first()
        if rider:
            out.rider = UserOut.model_validate(rider)
    return out


# ── quote (no auth needed, used live as the rider configures a trip) ───────
@router.post("/quote")
def quote(data: QuoteRequest):
    if data.tier not in TIERS:
        raise HTTPException(400, "Invalid tier")
    return estimate_fare(
        mode=data.mode, tier=data.tier, distance_miles=data.distance_miles,
        duration_hours=data.duration_hours, hourly_rate=data.hourly_rate, stops=data.stops,
    )


# ── nearby drivers (riders find a car) ─────────────────────────────────────
@router.get("/nearby")
def nearby_drivers(
    lat: float = Query(37.7749), lng: float = Query(-122.4194),
    tier: Optional[str] = None, db: Session = Depends(get_db),
):
    q = db.query(User).filter(User.is_online == True, User.role.in_(["driver", "both"]))  # noqa: E712
    drivers = q.all()
    results = []
    for d in drivers:
        veh = db.query(Vehicle).filter(Vehicle.driver_id == d.id).first()
        if tier and (not veh or veh.tier != tier):
            continue
        dist = haversine_miles(lat, lng, d.current_lat, d.current_lng)
        eta = max(2, round(dist / 0.4))  # ~24 mph -> minutes
        results.append({
            "id": d.id, "name": d.name, "rating": round(d.rating, 2),
            "avatar_color": d.avatar_color, "lat": d.current_lat, "lng": d.current_lng,
            "hourly_rate": d.hourly_rate, "eta_min": eta, "distance_mi": round(dist, 1),
            "vehicle": VehicleOut.model_validate(veh).model_dump() if veh else None,
        })
    results.sort(key=lambda x: x["eta_min"])
    return results


# ── create a ride request ──────────────────────────────────────────────────
@router.post("/", response_model=RideOut, status_code=201)
def create_ride(data: RideCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.tier not in TIERS:
        raise HTTPException(400, "Invalid tier")
    if data.mode not in ("dropoff", "hourly"):
        raise HTTPException(400, "Invalid ride mode")

    # Distance for dropoff: prefer real coords, fall back to supplied estimate.
    distance = data.distance_miles
    if data.mode == "dropoff" and data.dropoff_lat and data.dropoff_lng:
        distance = haversine_miles(data.pickup_lat, data.pickup_lng,
                                   data.dropoff_lat, data.dropoff_lng)

    fare = estimate_fare(
        mode=data.mode, tier=data.tier, distance_miles=distance,
        duration_hours=data.duration_hours, hourly_rate=user.hourly_rate or 45.0,
        stops=len(data.stops),
    )

    ride = Ride(
        rider_id=user.id, mode=data.mode, tier=data.tier,
        pickup_address=data.pickup_address, pickup_lat=data.pickup_lat, pickup_lng=data.pickup_lng,
        dropoff_address=data.dropoff_address, dropoff_lat=data.dropoff_lat, dropoff_lng=data.dropoff_lng,
        stops=json.dumps([s.model_dump() for s in data.stops]),
        preferences=json.dumps(data.preferences),
        scheduled_time=data.scheduled_time, duration_hours=data.duration_hours,
        distance_miles=round(distance, 1), passengers=data.passengers, notes=data.notes,
        status="requested", fare_estimate=fare["total"], payment_method=data.payment_method,
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return serialize_ride(db, ride)


# ── list my rides (as rider) ───────────────────────────────────────────────
@router.get("/", response_model=List[RideOut])
def my_rides(status: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Ride).filter(Ride.rider_id == user.id)
    if status:
        q = q.filter(Ride.status == status)
    rides = q.order_by(Ride.created_at.desc()).limit(100).all()
    return [serialize_ride(db, r) for r in rides]


# ── driver: open requests to accept ─────────────────────────────────────────
@router.get("/available", response_model=List[RideOut])
def available_rides(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("driver", "both"):
        raise HTTPException(403, "Only drivers can view available rides")
    rides = db.query(Ride).filter(Ride.status == "requested").order_by(Ride.created_at.desc()).limit(50).all()
    return [serialize_ride(db, r, include_rider=True) for r in rides]


# ── driver: rides I'm assigned to ───────────────────────────────────────────
@router.get("/driving", response_model=List[RideOut])
def driving_rides(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rides = db.query(Ride).filter(Ride.driver_id == user.id).order_by(Ride.created_at.desc()).limit(100).all()
    return [serialize_ride(db, r, include_rider=True) for r in rides]


@router.get("/{ride_id}", response_model=RideOut)
def get_ride(ride_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Ride).filter(Ride.id == ride_id).first()
    if not r:
        raise HTTPException(404, "Ride not found")
    if user.id not in (r.rider_id, r.driver_id) and user.role not in ("driver", "both"):
        raise HTTPException(403, "Not allowed")
    return serialize_ride(db, r, include_rider=True)


@router.post("/{ride_id}/accept", response_model=RideOut)
def accept_ride(ride_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("driver", "both"):
        raise HTTPException(403, "Only drivers can accept rides")
    r = db.query(Ride).filter(Ride.id == ride_id).first()
    if not r:
        raise HTTPException(404, "Ride not found")
    if r.status != "requested":
        raise HTTPException(400, "Ride is no longer available")
    r.driver_id = user.id
    r.status = "accepted"
    r.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return serialize_ride(db, r, include_rider=True)


@router.post("/{ride_id}/status", response_model=RideOut)
def update_status(ride_id: int, data: StatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Ride).filter(Ride.id == ride_id).first()
    if not r:
        raise HTTPException(404, "Ride not found")
    if user.id not in (r.rider_id, r.driver_id):
        raise HTTPException(403, "Not allowed")
    valid = {"accepted", "arriving", "in_progress", "completed", "cancelled"}
    if data.status not in valid:
        raise HTTPException(400, "Invalid status")
    r.status = data.status
    if data.status == "completed":
        r.completed_at = datetime.utcnow()
        r.final_fare = r.fare_estimate
        if r.payment_method == "cash":
            r.payment_status = "paid"
    db.commit()
    db.refresh(r)
    return serialize_ride(db, r, include_rider=True)


@router.post("/{ride_id}/cancel", response_model=RideOut)
def cancel_ride(ride_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Ride).filter(Ride.id == ride_id).first()
    if not r:
        raise HTTPException(404, "Ride not found")
    if user.id not in (r.rider_id, r.driver_id):
        raise HTTPException(403, "Not allowed")
    if r.status in ("completed", "cancelled"):
        raise HTTPException(400, "Ride already finished")
    r.status = "cancelled"
    db.commit()
    db.refresh(r)
    return serialize_ride(db, r, include_rider=True)


# ── payment for a ride ──────────────────────────────────────────────────────
@router.post("/{ride_id}/pay")
def pay_ride(ride_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Ride).filter(Ride.id == ride_id).first()
    if not r:
        raise HTTPException(404, "Ride not found")
    if r.rider_id != user.id:
        raise HTTPException(403, "Only the rider can pay")

    amount = r.final_fare or r.fare_estimate
    info = payment_instructions(r.payment_method, amount, r.id)

    # Cash App / Venmo / PayPal / Zelle settle out-of-band -> mark as paid optimistically.
    # Stripe/cash resolve elsewhere (card auth / on completion).
    status = "paid" if r.payment_method in ("cashapp", "venmo", "paypal", "zelle") else "pending"
    r.payment_status = status

    payment = Payment(
        ride_id=r.id, user_id=user.id, amount=amount, method=r.payment_method,
        status=status, reference=info.get("deeplink") or info.get("client_secret", ""),
    )
    db.add(payment)
    db.commit()
    return {"ride_id": r.id, "amount": round(amount, 2), "payment_status": status, **info}
