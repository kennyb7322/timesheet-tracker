"""Seed demo drivers, vehicles and accounts so the app is usable immediately."""
from backend.database import SessionLocal
from backend.models import User, Vehicle
from backend.auth import hash_password

# Centered near downtown San Francisco; spread drivers around it.
DEMO_DRIVERS = [
    {"name": "Marcus Lee", "email": "marcus@ucsrides.com", "color": "#5B8DEF", "rating": 4.9,
     "rate": 42, "lat": 37.7790, "lng": -122.4170,
     "veh": {"make": "Toyota", "model": "Camry", "year": 2022, "color": "Silver", "plate": "UCS-1042", "seats": 4, "tier": "standard"}},
    {"name": "Priya Nair", "email": "priya@ucsrides.com", "color": "#22C55E", "rating": 4.95,
     "rate": 48, "lat": 37.7720, "lng": -122.4240,
     "veh": {"make": "Honda", "model": "CR-V", "year": 2023, "color": "Black", "plate": "UCS-7781", "seats": 6, "tier": "xl"}},
    {"name": "Diego Ramos", "email": "diego@ucsrides.com", "color": "#F59E0B", "rating": 4.8,
     "rate": 65, "lat": 37.7810, "lng": -122.4110,
     "veh": {"make": "Tesla", "model": "Model S", "year": 2024, "color": "White", "plate": "UCS-9001", "seats": 4, "tier": "lux"}},
    {"name": "Aisha Khan", "email": "aisha@ucsrides.com", "color": "#EC4899", "rating": 4.88,
     "rate": 44, "lat": 37.7685, "lng": -122.4150,
     "veh": {"make": "Hyundai", "model": "Sonata", "year": 2021, "color": "Blue", "plate": "UCS-3320", "seats": 4, "tier": "standard"}},
    {"name": "Tom Becker", "email": "tom@ucsrides.com", "color": "#8B5CF6", "rating": 4.7,
     "rate": 50, "lat": 37.7755, "lng": -122.4280,
     "veh": {"make": "Chevrolet", "model": "Suburban", "year": 2022, "color": "Gray", "plate": "UCS-5567", "seats": 7, "tier": "xl"}},
]

# A ready-made rider and a ready-made driver login for quick demos.
DEMO_ACCOUNTS = [
    {"name": "Demo Rider", "email": "rider@ucsrides.com", "role": "rider", "color": "#5B8DEF"},
    {"name": "Demo Driver", "email": "driver@ucsrides.com", "role": "both", "color": "#22C55E",
     "veh": {"make": "Kia", "model": "Telluride", "year": 2023, "color": "Green", "plate": "UCS-2200", "seats": 6, "tier": "xl"}},
]

DEMO_PASSWORD = "password123"


def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return  # already seeded

        for d in DEMO_DRIVERS:
            user = User(
                name=d["name"], email=d["email"], phone="",
                password_hash=hash_password(DEMO_PASSWORD),
                role="driver", avatar_color=d["color"], rating=d["rating"],
                is_online=True, current_lat=d["lat"], current_lng=d["lng"],
                hourly_rate=d["rate"], default_payment_method="stripe",
            )
            db.add(user)
            db.flush()
            v = d["veh"]
            db.add(Vehicle(driver_id=user.id, is_default=True, **v))

        for a in DEMO_ACCOUNTS:
            user = User(
                name=a["name"], email=a["email"], phone="",
                password_hash=hash_password(DEMO_PASSWORD),
                role=a["role"], avatar_color=a["color"], rating=5.0,
                is_online=False, current_lat=37.7749, current_lng=-122.4194,
                hourly_rate=45.0, default_payment_method="stripe",
            )
            db.add(user)
            db.flush()
            if "veh" in a:
                db.add(Vehicle(driver_id=user.id, is_default=True, **a["veh"]))

        db.commit()
    finally:
        db.close()
