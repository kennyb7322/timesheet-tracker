"""Pydantic schemas for UCS Rides."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: str
    phone: str = ""
    password: str = Field(min_length=6)
    role: str = "rider"  # rider | driver | both


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    default_payment_method: str
    rating: float
    avatar_color: str
    is_online: bool
    hourly_rate: float

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    default_payment_method: Optional[str] = None
    hourly_rate: Optional[float] = None
    role: Optional[str] = None


# ── Vehicles ─────────────────────────────────────────────────────────────
class VehicleCreate(BaseModel):
    make: str = ""
    model: str = ""
    year: int = 2020
    color: str = ""
    plate: str = ""
    seats: int = 4
    tier: str = "standard"


class VehicleOut(BaseModel):
    id: int
    driver_id: int
    make: str
    model: str
    year: int
    color: str
    plate: str
    seats: int
    tier: str
    is_default: bool

    class Config:
        from_attributes = True


# ── Rides ────────────────────────────────────────────────────────────────
class Stop(BaseModel):
    address: str
    lat: float = 0.0
    lng: float = 0.0


class QuoteRequest(BaseModel):
    mode: str = "dropoff"          # dropoff | hourly
    tier: str = "standard"
    distance_miles: float = 0.0
    duration_hours: float = 0.0
    stops: int = 0
    hourly_rate: float = 45.0


class RideCreate(BaseModel):
    mode: str = "dropoff"
    tier: str = "standard"
    pickup_address: str
    pickup_lat: float = 37.7749
    pickup_lng: float = -122.4194
    dropoff_address: str = ""
    dropoff_lat: float = 0.0
    dropoff_lng: float = 0.0
    stops: List[Stop] = []
    preferences: List[str] = []
    scheduled_time: str = ""
    duration_hours: float = 0.0
    distance_miles: float = 0.0
    passengers: int = 1
    notes: str = ""
    payment_method: str = "stripe"


class DriverMini(BaseModel):
    id: int
    name: str
    rating: float
    avatar_color: str
    current_lat: float
    current_lng: float
    hourly_rate: float
    vehicle: Optional[VehicleOut] = None


class RideOut(BaseModel):
    id: int
    rider_id: int
    driver_id: Optional[int]
    mode: str
    tier: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    stops: List[Stop] = []
    preferences: List[str] = []
    scheduled_time: str
    duration_hours: float
    distance_miles: float
    passengers: int
    notes: str
    status: str
    fare_estimate: float
    final_fare: float
    payment_method: str
    payment_status: str
    created_at: datetime
    driver: Optional[DriverMini] = None
    rider: Optional[UserOut] = None

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


class PaymentOut(BaseModel):
    id: int
    ride_id: int
    amount: float
    method: str
    status: str
    reference: str
    created_at: datetime

    class Config:
        from_attributes = True
