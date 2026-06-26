"""Fare estimation + payment-handle / deeplink helpers for UCS Rides."""
import os
from urllib.parse import quote

BOOKING_FEE = 2.50          # flat platform fee per ride
MIN_FARE = 7.00             # minimum charged for a dropoff trip

# Per-tier pricing. Hourly hire uses the driver's own hourly_rate, scaled by tier.
TIERS = {
    "standard": {"base": 2.50, "per_mile": 1.40, "per_min": 0.30, "hourly_mult": 1.00},
    "xl":       {"base": 4.00, "per_mile": 2.10, "per_min": 0.45, "hourly_mult": 1.35},
    "lux":      {"base": 7.00, "per_mile": 3.40, "per_min": 0.70, "hourly_mult": 1.80},
}

# UCS business payment handles — riders pay these. Override via env in production.
PAYMENT_HANDLES = {
    "cashapp": os.environ.get("UCS_CASHAPP", "$UCSRides"),
    "venmo":   os.environ.get("UCS_VENMO", "UCS-Rides"),
    "paypal":  os.environ.get("UCS_PAYPAL", "UCSRides"),
    "zelle":   os.environ.get("UCS_ZELLE", "pay@ucsolutions.com"),
}

PAYMENT_LABELS = {
    "cashapp": "Cash App",
    "venmo": "Venmo",
    "paypal": "PayPal",
    "zelle": "Zelle",
    "stripe": "Credit / Debit Card",
    "cash": "Cash",
}


def estimate_fare(mode: str, tier: str, distance_miles: float,
                  duration_hours: float, hourly_rate: float, stops: int = 0) -> dict:
    """Return a fare breakdown dict for the given ride parameters."""
    cfg = TIERS.get(tier, TIERS["standard"])

    if mode == "hourly":
        hours = max(duration_hours, 1.0)  # 1 hour minimum for time-hire
        rate = round(hourly_rate * cfg["hourly_mult"], 2)
        time_charge = round(rate * hours, 2)
        stop_charge = round(stops * 1.50, 2)  # small convenience fee per extra stop
        subtotal = time_charge + stop_charge
        total = round(subtotal + BOOKING_FEE, 2)
        return {
            "mode": "hourly",
            "tier": tier,
            "hourly_rate": rate,
            "hours": hours,
            "time_charge": time_charge,
            "stop_charge": stop_charge,
            "booking_fee": BOOKING_FEE,
            "total": total,
        }

    # Point-to-point dropoff. Estimate trip minutes from distance (~22 mph city avg).
    minutes = max(distance_miles / 22.0 * 60.0, 3.0)
    base = cfg["base"]
    dist_charge = round(distance_miles * cfg["per_mile"], 2)
    time_charge = round(minutes * cfg["per_min"], 2)
    subtotal = base + dist_charge + time_charge
    total = round(max(subtotal + BOOKING_FEE, MIN_FARE), 2)
    return {
        "mode": "dropoff",
        "tier": tier,
        "base": base,
        "distance_miles": round(distance_miles, 1),
        "distance_charge": dist_charge,
        "est_minutes": round(minutes),
        "time_charge": time_charge,
        "booking_fee": BOOKING_FEE,
        "total": total,
    }


def payment_instructions(method: str, amount: float, ride_id: int) -> dict:
    """Build a payment handle + deeplink (where the app supports it) for a method."""
    amount = round(amount, 2)
    note = quote(f"UCS Rides #{ride_id}")
    handle = PAYMENT_HANDLES.get(method, "")

    if method == "cashapp":
        return {
            "method": method, "label": PAYMENT_LABELS[method], "handle": handle,
            "deeplink": f"https://cash.app/{handle}/{amount}",
            "instructions": f"Send ${amount:.2f} to {handle} on Cash App. Add note “UCS Rides #{ride_id}”.",
        }
    if method == "venmo":
        return {
            "method": method, "label": PAYMENT_LABELS[method], "handle": f"@{handle}",
            "deeplink": (f"https://venmo.com/{handle}?txn=pay&amount={amount}&note={note}"),
            "instructions": f"Pay ${amount:.2f} to @{handle} on Venmo with note “UCS Rides #{ride_id}”.",
        }
    if method == "paypal":
        return {
            "method": method, "label": PAYMENT_LABELS[method], "handle": handle,
            "deeplink": f"https://paypal.me/{handle}/{amount}",
            "instructions": f"Pay ${amount:.2f} via PayPal to {handle}.",
        }
    if method == "zelle":
        return {
            "method": method, "label": PAYMENT_LABELS[method], "handle": handle,
            "deeplink": "",
            "instructions": (f"Open your bank's Zelle and send ${amount:.2f} to "
                             f"{handle}. Memo: “UCS Rides #{ride_id}”."),
        }
    if method == "stripe":
        # Placeholder client secret. Wire to a real Stripe PaymentIntent in prod.
        return {
            "method": method, "label": PAYMENT_LABELS[method], "handle": "",
            "deeplink": "",
            "client_secret": f"pi_demo_{ride_id}_secret",
            "instructions": f"Charge ${amount:.2f} to your card on file.",
        }
    # cash
    return {
        "method": "cash", "label": PAYMENT_LABELS["cash"], "handle": "",
        "deeplink": "",
        "instructions": f"Pay your driver ${amount:.2f} in cash at the end of the trip.",
    }
