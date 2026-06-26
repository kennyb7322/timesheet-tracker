import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../api/client';
import { useAuth } from '../auth';
import MapView from './MapView';
import { CarIcon, StarIcon, CheckIcon } from '../icons';

const ACTIVE = ['accepted', 'arriving', 'in_progress'];
const NEXT = { accepted: 'arriving', arriving: 'in_progress', in_progress: 'completed' };
const NEXT_LABEL = { accepted: "I've arrived", arriving: 'Start trip', in_progress: 'Complete trip' };

export default function DriverDashboard({ toast }) {
  const { user, patchUser } = useAuth();
  const [online, setOnline] = useState(user.is_online);
  const [available, setAvailable] = useState([]);
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  const center = { lat: user.current_lat, lng: user.current_lng };

  const load = useCallback(async () => {
    try {
      const mine = await api.drivingRides();
      const live = mine.find((r) => ACTIVE.includes(r.status));
      setCurrent(live || null);
      if (!live && online) setAvailable(await api.availableRides());
    } catch { /* ignore */ }
  }, [online]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!online) return;
    timer.current = setInterval(load, 5000);
    return () => clearInterval(timer.current);
  }, [online, load]);

  const toggle = async () => {
    const next = !online;
    setOnline(next);
    try {
      await api.setOnline(next, center.lat, center.lng);
      patchUser({ is_online: next });
      toast(next ? "You're online — accepting rides" : "You're offline", next ? 'success' : 'info');
      if (next) load();
    } catch (e) { toast(e.message, 'error'); setOnline(!next); }
  };

  const accept = async (id) => {
    setBusy(true);
    try {
      const r = await api.acceptRide(id);
      setCurrent(r);
      setAvailable([]);
      toast('Ride accepted — head to pickup', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  const advance = async () => {
    setBusy(true);
    try {
      const r = await api.setRideStatus(current.id, NEXT[current.status]);
      if (r.status === 'completed') {
        toast('Trip complete! Earnings added.', 'success');
        setCurrent(null);
        load();
      } else {
        setCurrent(r);
      }
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  };

  // ── Active trip view ──
  if (current) {
    return (
      <div className="page">
        <MapView center={center} pickupLabel="Rider" tall badge={`Trip #${current.id} · ${current.status.replace('_', ' ')}`} />
        <div style={{ height: 16 }} />
        <div className="card">
          <div className="ride-head">
            <div className="avatar" style={{ background: current.rider?.avatar_color || 'var(--accent)' }}>{current.rider?.name?.charAt(0) || 'R'}</div>
            <div style={{ flex: 1 }}>
              <div className="pay-name">{current.rider?.name || 'Rider'}</div>
              <div className="pay-sub">{current.passengers} passenger{current.passengers > 1 ? 's' : ''} · {current.mode === 'hourly' ? `${current.duration_hours}h hire` : `${current.distance_miles} mi`}</div>
            </div>
            <span className="mono" style={{ fontWeight: 800 }}>${(current.final_fare || current.fare_estimate).toFixed(2)}</span>
          </div>
          <div className="ride-route">
            <div className="route-pt"><small>Pickup</small>{current.pickup_address}</div>
            {current.stops?.map((s, i) => <div key={i} className="route-pt"><small>Stop {i + 1}</small>{s.address}</div>)}
            {current.mode === 'dropoff' && <div className="route-pt dest"><small>Destination</small>{current.dropoff_address || '—'}</div>}
          </div>
          {current.preferences?.length > 0 && (
            <div className="meta-pills" style={{ marginTop: 10 }}>
              {current.preferences.map((p) => <span key={p} className="pill">{p}</span>)}
            </div>
          )}
          {current.notes && <div className="pill" style={{ marginTop: 8 }}>Note: {current.notes}</div>}
        </div>
        <button className="btn btn-primary" onClick={advance} disabled={busy}>
          {busy ? <span className="spinner" /> : NEXT_LABEL[current.status]}
        </button>
      </div>
    );
  }

  // ── Online / available view ──
  return (
    <div className="page">
      <div className={`online-bar ${online ? 'live' : ''}`} onClick={toggle} style={{ cursor: 'pointer' }}>
        <div>
          <div className="pay-name">{online ? "You're online" : "You're offline"}</div>
          <div className="pay-sub">{online ? 'Waiting for ride requests…' : 'Go online to start earning'}</div>
        </div>
        <div className={`switch ${online ? 'on' : ''}`}><div className="knob" /></div>
      </div>

      <MapView center={center} pickupLabel="You" badge={online ? 'Live · accepting rides' : 'Offline'} />
      <div style={{ height: 16 }} />

      {!online ? (
        <div className="empty"><CarIcon /><p>Flip the switch above to receive ride requests.</p></div>
      ) : available.length === 0 ? (
        <div className="empty"><span className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} /><p style={{ marginTop: 14 }}>Looking for nearby ride requests…</p></div>
      ) : (
        <>
          <div className="card-title">{available.length} request{available.length > 1 ? 's' : ''} available</div>
          {available.map((r) => (
            <div key={r.id} className="ride-card">
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className={`badge ${r.mode === 'hourly' ? 'in_progress' : 'requested'}`}>{r.mode === 'hourly' ? `${r.duration_hours}h hire` : 'Single trip'}</span>
                <span className="mono" style={{ fontWeight: 800, fontSize: '1.1rem' }}>${r.fare_estimate.toFixed(2)}</span>
              </div>
              <div className="ride-route">
                <div className="route-pt"><small>Pickup</small>{r.pickup_address}</div>
                {r.stops?.map((s, i) => <div key={i} className="route-pt"><small>Stop {i + 1}</small>{s.address}</div>)}
                {r.mode === 'dropoff' && <div className="route-pt dest"><small>Destination</small>{r.dropoff_address || '—'}</div>}
              </div>
              <div className="meta-pills" style={{ marginBottom: 12 }}>
                <span className="pill" style={{ textTransform: 'capitalize' }}>{r.tier}</span>
                <span className="pill">{r.passengers} pax</span>
                {r.rider && <span className="pill flex gap8" style={{ alignItems: 'center' }}><StarIcon style={{ width: 11, height: 11, color: 'var(--gold)' }} />{r.rider.rating.toFixed(1)} · {r.rider.name}</span>}
              </div>
              <button className="btn btn-primary" onClick={() => accept(r.id)} disabled={busy}>
                <CheckIcon style={{ width: 18, height: 18 }} /> Accept ride
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
