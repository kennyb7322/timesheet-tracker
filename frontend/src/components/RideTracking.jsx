import { useState, useEffect, useRef } from 'react';
import * as api from '../api/client';
import MapView from './MapView';
import Modal from './Modal';
import { PAY_META } from '../payments';
import { StarIcon, CarIcon, CheckIcon } from '../icons';

const STEPS = [
  { key: 'requested', label: 'Finding your driver' },
  { key: 'accepted', label: 'Driver on the way' },
  { key: 'arriving', label: 'Driver arriving' },
  { key: 'in_progress', label: 'On your trip' },
  { key: 'completed', label: 'Trip complete' },
];

export default function RideTracking({ ride: initial, onDone, toast }) {
  const [ride, setRide] = useState(initial);
  const [payInfo, setPayInfo] = useState(null);
  const [paying, setPaying] = useState(false);
  const timer = useRef(null);

  // Poll for status changes while the ride is live.
  useEffect(() => {
    const tick = async () => {
      try {
        const r = await api.getRide(ride.id);
        setRide(r);
      } catch { /* ignore */ }
    };
    timer.current = setInterval(tick, 4000);
    return () => clearInterval(timer.current);
  }, [ride.id]);

  const stepIdx = STEPS.findIndex((s) => s.key === ride.status);
  const center = { lat: ride.pickup_lat, lng: ride.pickup_lng };
  const driver = ride.driver;

  const cancel = async () => {
    try {
      await api.cancelRide(ride.id);
      toast('Ride cancelled', 'info');
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };

  const pay = async () => {
    setPaying(true);
    try {
      const info = await api.payRide(ride.id);
      setPayInfo(info);
      if (info.payment_status === 'paid') toast('Payment confirmed — thank you!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setPaying(false); }
  };

  if (ride.status === 'cancelled') {
    return (
      <div className="page">
        <div className="empty" style={{ paddingTop: 80 }}>
          <p>This ride was cancelled.</p>
          <button className="btn btn-primary" style={{ marginTop: 20, maxWidth: 240, margin: '20px auto 0' }} onClick={onDone}>Book another ride</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <MapView center={center} drivers={driver ? [{ id: driver.id, lat: driver.current_lat, lng: driver.current_lng, avatar_color: driver.avatar_color }] : []}
        pickupLabel="Pickup" tall badge={STEPS[stepIdx]?.label} />

      <div style={{ height: 16 }} />

      {/* Progress steps */}
      <div className="card">
        {STEPS.map((s, i) => (
          <div key={s.key} className="row-between" style={{ padding: '8px 0', opacity: i <= stepIdx ? 1 : 0.4 }}>
            <div className="flex gap8" style={{ alignItems: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: i < stepIdx ? 'var(--accent)' : i === stepIdx ? 'var(--accent-soft)' : 'var(--bg-hover)',
                color: i < stepIdx ? '#04130E' : 'var(--accent)', border: i === stepIdx ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}>
                {i < stepIdx ? <CheckIcon style={{ width: 15, height: 15 }} /> : <span style={{ fontSize: 12, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{ fontWeight: i === stepIdx ? 700 : 500 }}>{s.label}</span>
            </div>
            {i === stepIdx && ride.status !== 'completed' && <span className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />}
          </div>
        ))}
      </div>

      {/* Driver card */}
      {driver && (
        <div className="card">
          <div className="ride-head">
            <div className="avatar" style={{ background: driver.avatar_color }}>{driver.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <div className="pay-name">{driver.name}</div>
              <div className="pay-sub flex gap8" style={{ alignItems: 'center' }}>
                <StarIcon style={{ width: 13, height: 13, color: 'var(--gold)' }} /> {driver.rating.toFixed(2)}
                {driver.vehicle && <span>· {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}</span>}
              </div>
            </div>
            {driver.vehicle && <div className="pill mono">{driver.vehicle.plate}</div>}
          </div>
        </div>
      )}

      {/* Trip summary */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span className={`badge ${ride.status}`}>{ride.status.replace('_', ' ')}</span>
          <span className="pill">{ride.mode === 'hourly' ? `Hire · ${ride.duration_hours}h` : 'Single trip'}</span>
        </div>
        <div className="ride-route">
          <div className="route-pt"><small>Pickup</small>{ride.pickup_address}</div>
          {ride.stops?.map((s, i) => <div key={i} className="route-pt"><small>Stop {i + 1}</small>{s.address}</div>)}
          {ride.mode === 'dropoff' && <div className="route-pt dest"><small>Destination</small>{ride.dropoff_address || '—'}</div>}
        </div>
        {ride.preferences?.length > 0 && (
          <div className="meta-pills" style={{ margin: '4px 0 10px' }}>
            {ride.preferences.map((p) => <span key={p} className="pill">{p}</span>)}
          </div>
        )}
        <div className="fare-line total"><span>Fare</span><span>${(ride.final_fare || ride.fare_estimate).toFixed(2)}</span></div>
      </div>

      {/* Actions */}
      {ride.status === 'completed' ? (
        ride.payment_status === 'paid' ? (
          <div className="card center">
            <CheckIcon style={{ width: 40, height: 40, color: 'var(--accent)' }} />
            <div className="section-title" style={{ marginTop: 8 }}>Paid · ${(ride.final_fare || ride.fare_estimate).toFixed(2)}</div>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onDone}>Book another ride</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={pay} disabled={paying}>
            {paying ? <span className="spinner" /> : `Pay $${(ride.final_fare || ride.fare_estimate).toFixed(2)} · ${PAY_META[ride.payment_method]?.label}`}
          </button>
        )
      ) : (
        <button className="btn btn-danger" onClick={cancel}>Cancel ride</button>
      )}
      <div style={{ height: 20 }} />

      <Modal open={!!payInfo} title="Complete your payment" onClose={() => { setPayInfo(null); if (payInfo?.payment_status === 'paid') onDone(); }}>
        {payInfo && (
          <>
            <div className="card" style={{ background: 'var(--bg-card)' }}>
              <div className="flex gap8" style={{ alignItems: 'center', marginBottom: 10 }}>
                <div className="pay-logo" style={{ background: PAY_META[payInfo.method]?.bg }}>{PAY_META[payInfo.method]?.short}</div>
                <div>
                  <div className="pay-name">{payInfo.label}</div>
                  {payInfo.handle && <div className="pay-sub mono">{payInfo.handle}</div>}
                </div>
                <div className="tier-price" style={{ marginLeft: 'auto' }}>${payInfo.amount.toFixed(2)}</div>
              </div>
              <p className="muted" style={{ fontSize: '0.88rem' }}>{payInfo.instructions}</p>
            </div>
            {payInfo.deeplink && (
              <a className="btn btn-primary" href={payInfo.deeplink} target="_blank" rel="noreferrer">Open {payInfo.label}</a>
            )}
            {payInfo.payment_status === 'paid' && (
              <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { setPayInfo(null); onDone(); }}>Done</button>
            )}
            {payInfo.method === 'stripe' && (
              <button className="btn btn-dark" style={{ marginTop: 10 }} onClick={() => { toast('Card charged (demo)', 'success'); setPayInfo(null); onDone(); }}>Charge card</button>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
