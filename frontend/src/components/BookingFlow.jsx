import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';
import { useAuth } from '../auth';
import MapView from './MapView';
import { PAY_META, PAY_ORDER } from '../payments';
import { CarIcon, UsersIcon, CrownIcon, PinIcon, PlusIcon, CheckIcon } from '../icons';

const CENTER = { lat: 37.7749, lng: -122.4194 };
const BASE_HOURLY = 45; // representative platform rate used for hourly quotes

// A deliberately wide set of ride preferences riders can opt into.
const PREFERENCES = [
  'Quiet ride', 'Happy to chat', 'Play music', 'Eating & drinks OK', 'Smoking OK',
  'Pets welcome', 'Extra luggage', 'Help with bags', 'A/C on', 'Child seat',
  'Wheelchair accessible', 'Phone calls OK',
];

const TIERS = [
  { key: 'standard', name: 'UCS Standard', desc: 'Everyday rides · up to 4', Icon: CarIcon },
  { key: 'xl', name: 'UCS XL', desc: 'Extra seats · up to 6', Icon: UsersIcon },
  { key: 'lux', name: 'UCS Lux', desc: 'Premium cars · up to 4', Icon: CrownIcon },
];

export default function BookingFlow({ onBooked, toast }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('dropoff');
  const [tier, setTier] = useState('standard');
  const [pickup, setPickup] = useState('Current location');
  const [dropoff, setDropoff] = useState('');
  const [miles, setMiles] = useState(4.5);
  const [hours, setHours] = useState(2);
  const [stops, setStops] = useState([]);
  const [passengers, setPassengers] = useState(1);
  const [prefs, setPrefs] = useState([]);
  const [payMethod, setPayMethod] = useState(user?.default_payment_method || 'stripe');
  const [notes, setNotes] = useState('');

  const togglePref = (p) => setPrefs((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);

  const [drivers, setDrivers] = useState([]);
  const [tierPrices, setTierPrices] = useState({});
  const [fare, setFare] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Live nearby drivers
  useEffect(() => {
    api.nearbyDrivers(CENTER.lat, CENTER.lng).then(setDrivers).catch(() => {});
  }, []);

  // Quote all three tiers so the picker shows live prices
  const refreshQuotes = useCallback(async () => {
    const validStops = stops.filter((s) => s.trim()).length;
    const results = {};
    await Promise.all(TIERS.map(async (t) => {
      try {
        const q = await api.quote({
          mode, tier: t.key, distance_miles: miles,
          duration_hours: hours, stops: validStops, hourly_rate: BASE_HOURLY,
        });
        results[t.key] = q.total;
      } catch { /* ignore */ }
    }));
    setTierPrices(results);
  }, [mode, miles, hours, stops]);

  useEffect(() => { refreshQuotes(); }, [refreshQuotes]);

  // Detailed fare for the chosen tier
  useEffect(() => {
    const validStops = stops.filter((s) => s.trim()).length;
    api.quote({ mode, tier, distance_miles: miles, duration_hours: hours, stops: validStops, hourly_rate: BASE_HOURLY })
      .then(setFare).catch(() => {});
  }, [mode, tier, miles, hours, stops]);

  const filteredDrivers = drivers.filter((d) => !tier || (d.vehicle && d.vehicle.tier === tier) || tier === 'standard');

  const addStop = () => setStops((s) => [...s, '']);
  const setStop = (i, v) => setStops((s) => s.map((x, j) => (j === i ? v : x)));
  const removeStop = (i) => setStops((s) => s.filter((_, j) => j !== i));

  const canSubmit = pickup.trim() && (mode === 'hourly' || dropoff.trim());

  const submit = async () => {
    if (!canSubmit) { toast('Add a pickup and destination', 'error'); return; }
    setSubmitting(true);
    try {
      const ride = await api.createRide({
        mode, tier,
        pickup_address: pickup.trim(),
        pickup_lat: CENTER.lat, pickup_lng: CENTER.lng,
        dropoff_address: mode === 'dropoff' ? dropoff.trim() : '',
        distance_miles: mode === 'dropoff' ? miles : 0,
        duration_hours: mode === 'hourly' ? hours : 0,
        stops: stops.filter((s) => s.trim()).map((address) => ({ address })),
        preferences: prefs,
        passengers, notes: notes.trim(),
        payment_method: payMethod,
      });
      toast('Ride requested — finding your driver!', 'success');
      onBooked(ride);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1 className="section-title">Where to, {user?.name?.split(' ')[0]}?</h1>
      <p className="section-sub">Book a single trip or hire a driver by the hour for multiple stops.</p>

      <MapView center={CENTER} drivers={filteredDrivers} pickupLabel="You"
        badge={`${filteredDrivers.length} driver${filteredDrivers.length === 1 ? '' : 's'} nearby`} />

      <div style={{ height: 16 }} />

      <div className="mode-toggle">
        <button className={mode === 'dropoff' ? 'active' : ''} onClick={() => setMode('dropoff')}>Single trip</button>
        <button className={mode === 'hourly' ? 'active' : ''} onClick={() => setMode('hourly')}>Hire by time</button>
      </div>

      {/* Locations */}
      <div className="card">
        <div className="field">
          <label>Pickup</label>
          <input className="input" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup address" />
        </div>

        {mode === 'dropoff' ? (
          <>
            <div className="field">
              <label>Destination</label>
              <input className="input" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Where are you going?" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Estimated distance: <b className="mono">{miles} mi</b></label>
              <input type="range" min="1" max="40" step="0.5" value={miles}
                onChange={(e) => setMiles(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label>How long do you need the driver?</label>
              <div className="stepper">
                <button onClick={() => setHours((h) => Math.max(1, h - 1))}>−</button>
                <div className="val">{hours}<small>hour{hours > 1 ? 's' : ''}</small></div>
                <button onClick={() => setHours((h) => Math.min(12, h + 1))}>+</button>
              </div>
            </div>
            <div className="field" style={{ marginBottom: stops.length ? 12 : 0 }}>
              <label>Stops along the way (optional)</label>
              {stops.map((s, i) => (
                <div key={i} className="flex gap8" style={{ marginBottom: 8 }}>
                  <input className="input" value={s} onChange={(e) => setStop(i, e.target.value)} placeholder={`Stop ${i + 1}`} />
                  <button className="icon-btn" onClick={() => removeStop(i)} aria-label="Remove">✕</button>
                </div>
              ))}
              <button className="btn-sm btn-ghost" onClick={addStop}>
                <PlusIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Add stop
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tier picker */}
      <div className="card">
        <div className="card-title">Choose your ride</div>
        <div className="tier-row">
          {TIERS.map(({ key, name, desc, Icon }) => (
            <button key={key} className={`tier-opt ${tier === key ? 'active' : ''}`} onClick={() => setTier(key)}>
              <div className="tier-ico"><Icon /></div>
              <div>
                <div className="tier-name">{name}</div>
                <div className="tier-desc">{desc}</div>
              </div>
              <div className="tier-price">
                {tierPrices[key] != null ? `$${tierPrices[key].toFixed(2)}` : '—'}
                <small>{mode === 'hourly' ? `${hours}h total` : 'est.'}</small>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Passengers */}
      <div className="card">
        <div className="row-between">
          <div>
            <div className="pay-name">Passengers</div>
            <div className="pay-sub">How many riders?</div>
          </div>
          <div className="stepper">
            <button onClick={() => setPassengers((p) => Math.max(1, p - 1))}>−</button>
            <div className="val" style={{ minWidth: 40, fontSize: '1.3rem' }}>{passengers}</div>
            <button onClick={() => setPassengers((p) => Math.min(7, p + 1))}>+</button>
          </div>
        </div>
      </div>

      {/* Ride preferences */}
      <div className="card">
        <div className="card-title">Ride preferences</div>
        <p className="muted" style={{ fontSize: '0.82rem', marginTop: -6, marginBottom: 12 }}>
          Tap any that apply — your driver sees these before pickup.
        </p>
        <div className="choice-grid">
          {PREFERENCES.map((p) => (
            <button key={p} className={`choice ${prefs.includes(p) ? 'active' : ''}`} onClick={() => togglePref(p)}>
              {prefs.includes(p) && <CheckIcon className="tick" />} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Payment */}
      <div className="card">
        <div className="card-title">Payment method</div>
        <div className="pay-grid">
          {PAY_ORDER.map((m) => {
            const meta = PAY_META[m];
            return (
              <button key={m} className={`pay-chip ${payMethod === m ? 'active' : ''}`} onClick={() => setPayMethod(m)}>
                <div className="pay-logo" style={{ background: meta.bg }}>{meta.short}</div>
                <div>
                  <div className="pay-name">{meta.label}</div>
                  <div className="pay-sub">{meta.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Notes for driver (optional)</label>
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, luggage, accessibility…" />
        </div>
      </div>

      {/* Fare summary */}
      {fare && (
        <div className="card">
          <div className="card-title">Fare estimate</div>
          {mode === 'hourly' ? (
            <>
              <div className="fare-line"><span>{fare.hours}h × ${fare.hourly_rate?.toFixed(2)}/hr</span><span>${fare.time_charge?.toFixed(2)}</span></div>
              {fare.stop_charge > 0 && <div className="fare-line"><span>Extra stops</span><span>${fare.stop_charge?.toFixed(2)}</span></div>}
              <div className="fare-line"><span>Booking fee</span><span>${fare.booking_fee?.toFixed(2)}</span></div>
            </>
          ) : (
            <>
              <div className="fare-line"><span>Base fare</span><span>${fare.base?.toFixed(2)}</span></div>
              <div className="fare-line"><span>Distance ({fare.distance_miles} mi)</span><span>${fare.distance_charge?.toFixed(2)}</span></div>
              <div className="fare-line"><span>Time (~{fare.est_minutes} min)</span><span>${fare.time_charge?.toFixed(2)}</span></div>
              <div className="fare-line"><span>Booking fee</span><span>${fare.booking_fee?.toFixed(2)}</span></div>
            </>
          )}
          <div className="fare-line total"><span>Total</span><span>${fare.total?.toFixed(2)}</span></div>
        </div>
      )}

      <button className="btn btn-primary" onClick={submit} disabled={submitting || !canSubmit}>
        {submitting ? <span className="spinner" /> : (
          <><PinIcon style={{ width: 18, height: 18 }} />
            {mode === 'hourly' ? `Hire driver · $${fare?.total?.toFixed(2) ?? ''}` : `Request ride · $${fare?.total?.toFixed(2) ?? ''}`}</>
        )}
      </button>
      <div style={{ height: 20 }} />
    </div>
  );
}
