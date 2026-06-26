"""SQLAlchemy models for UCS Rides — riders, drivers, vehicles, rides, payments."""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


# Payment methods supported by the platform.
PAYMENT_METHODS = ["cashapp", "venmo", "paypal", "zelle", "stripe", "cash"]

# Ride lifecycle statuses.
RIDE_STATUSES = [
    "requested",   # rider submitted, awaiting a driver
    "accepted",    # a driver accepted, heading to pickup
    "arriving",    # driver is close / at pickup
    "in_progress", # rider on board (or hourly clock running)
    "completed",
    "cancelled",
]

# Service tiers — affect base/per-mile/per-hour pricing.
RIDE_TIERS = ["standard", "xl", "lux"]


class User(Base):
    """A single account that can act as a rider, a driver, or both."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String, default="")
    password_hash = Column(String, nullable=False)
    # role: "rider", "driver", or "both"
    role = Column(String, nullable=False, default="rider")
    default_payment_method = Column(String, default="stripe")
    rating = Column(Float, default=5.0)
    avatar_color = Column(String, default="#5B8DEF")

    # Driver-specific live state
    is_online = Column(Boolean, default=False)
    current_lat = Column(Float, default=37.7749)
    current_lng = Column(Float, default=-122.4194)
    hourly_rate = Column(Float, default=45.0)  # what a driver charges per hour for time-hire

    created_at = Column(DateTime, default=datetime.utcnow)

    vehicles = relationship("Vehicle", back_populates="driver", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    make = Column(String, default="")
    model = Column(String, default="")
    year = Column(Integer, default=2020)
    color = Column(String, default="")
    plate = Column(String, default="")
    seats = Column(Integer, default=4)
    tier = Column(String, default="standard")  # standard | xl | lux
    is_default = Column(Boolean, default=True)

    driver = relationship("User", back_populates="vehicles")


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # "dropoff"  -> classic point-to-point trip
    # "hourly"   -> hire the driver for a block of time / multiple stops
    mode = Column(String, nullable=False, default="dropoff")
    tier = Column(String, nullable=False, default="standard")

    pickup_address = Column(String, nullable=False)
    pickup_lat = Column(Float, default=37.7749)
    pickup_lng = Column(Float, default=-122.4194)

    dropoff_address = Column(String, default="")
    dropoff_lat = Column(Float, default=0.0)
    dropoff_lng = Column(Float, default=0.0)

    # JSON-encoded list of intermediate stops [{address, lat, lng}]
    stops = Column(Text, default="[]")
    # JSON-encoded list of free-form ride preferences chosen by the rider,
    # e.g. ["Happy to chat", "Play music", "Pets welcome"].
    preferences = Column(Text, default="[]")

    # When the rider wants to be picked up (ISO string). Empty => "now".
    scheduled_time = Column(String, default="")
    duration_hours = Column(Float, default=0.0)  # for hourly hire
    distance_miles = Column(Float, default=0.0)  # estimated, for dropoff

    passengers = Column(Integer, default=1)
    notes = Column(String, default="")

    status = Column(String, nullable=False, default="requested")
    fare_estimate = Column(Float, default=0.0)
    final_fare = Column(Float, default=0.0)

    payment_method = Column(String, default="stripe")
    payment_status = Column(String, default="pending")  # pending | paid | failed

    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending | paid | failed
    reference = Column(String, default="")      # deeplink / handle / intent id
    created_at = Column(DateTime, default=datetime.utcnow)
