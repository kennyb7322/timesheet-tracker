import { useState, useEffect } from 'react';
import * as api from '../api/client';
import { ListIcon, StarIcon } from '../icons';
import { PAY_META } from '../payments';

const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function ActivityPage() {
  const [rides, setRides] = useState(null);

  useEffect(() => { api.myRides().then(setRides).catch(() => setRides([])); }, []);

  if (!rides) return <div className="center-load"><span className="spinner" /></div>;

  return (
    <div className="page">
      <h1 className="section-title">Your trips</h1>
      <p className="section-sub">Every ride and time-hire you've booked.</p>

      {rides.length === 0 ? (
        <div className="empty"><ListIcon /><p>No trips yet. Book your first ride!</p></div>
      ) : rides.map((r) => (
        <div key={r.id} className="ride-card">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>{fmt(r.created_at)}</span>
            <span className={`badge ${r.status}`}>{r.status.replace('_', ' ')}</span>
          </div>
          <div className="ride-route">
            <div className="route-pt"><small>Pickup</small>{r.pickup_address}</div>
            {r.stops?.map((s, i) => <div key={i} className="route-pt"><small>Stop {i + 1}</small>{s.address}</div>)}
            {r.mode === 'dropoff' && <div className="route-pt dest"><small>Destination</small>{r.dropoff_address || '—'}</div>}
          </div>
          <div className="row-between" style={{ marginTop: 10 }}>
            <div className="meta-pills">
              <span className="pill">{r.mode === 'hourly' ? `Hire · ${r.duration_hours}h` : `${r.distance_miles} mi`}</span>
              <span className="pill" style={{ textTransform: 'capitalize' }}>{r.tier}</span>
              <span className="pill">{PAY_META[r.payment_method]?.label}</span>
              {r.driver && <span className="pill flex gap8" style={{ alignItems: 'center' }}><StarIcon style={{ width: 11, height: 11, color: 'var(--gold)' }} />{r.driver.name}</span>}
            </div>
            <span className="mono" style={{ fontWeight: 800 }}>${(r.final_fare || r.fare_estimate).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
