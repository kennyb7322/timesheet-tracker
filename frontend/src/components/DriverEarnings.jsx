import { useState, useEffect } from 'react';
import * as api from '../api/client';
import Modal from './Modal';
import { CarIcon, PlusIcon } from '../icons';

const TIERS = ['standard', 'xl', 'lux'];

export default function DriverEarnings({ toast }) {
  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [modal, setModal] = useState(false);
  const [veh, setVeh] = useState({ make: '', model: '', year: 2022, color: '', plate: '', seats: 4, tier: 'standard' });

  const load = () => {
    api.earnings().then(setStats).catch(() => {});
    api.drivingRides().then((r) => setTrips(r.filter((x) => x.status === 'completed'))).catch(() => {});
    api.myVehicles().then(setVehicles).catch(() => {});
  };
  useEffect(load, []);

  const addVehicle = async () => {
    if (!veh.make || !veh.model) { toast('Add make and model', 'error'); return; }
    try {
      await api.addVehicle({ ...veh, year: parseInt(veh.year) || 2022, seats: parseInt(veh.seats) || 4 });
      setModal(false);
      setVeh({ make: '', model: '', year: 2022, color: '', plate: '', seats: 4, tier: 'standard' });
      toast('Vehicle added', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const removeVehicle = async (id) => {
    try { await api.deleteVehicle(id); toast('Vehicle removed', 'info'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="page">
      <h1 className="section-title">Earnings</h1>
      <p className="section-sub">Your take-home from completed trips and time-hires.</p>

      <div className="stat-grid">
        <div className="stat"><div className="num">${stats?.take_home?.toFixed(0) ?? '0'}</div><div className="lbl">Take-home</div></div>
        <div className="stat"><div className="num">{stats?.completed_trips ?? 0}</div><div className="lbl">Trips</div></div>
        <div className="stat"><div className="num">${stats?.gross?.toFixed(0) ?? '0'}</div><div className="lbl">Gross</div></div>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Your vehicles</div>
          <button className="btn-sm btn-ghost" onClick={() => setModal(true)}><PlusIcon style={{ width: 14, height: 14, marginRight: 4 }} />Add</button>
        </div>
        {vehicles.length === 0 ? <p className="muted" style={{ fontSize: '0.88rem' }}>No vehicles yet. Add one to start driving.</p>
          : vehicles.map((v) => (
            <div key={v.id} className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex gap8" style={{ alignItems: 'center' }}>
                <div className="tier-ico" style={{ width: 38, height: 38 }}><CarIcon /></div>
                <div>
                  <div className="pay-name">{v.color} {v.make} {v.model}</div>
                  <div className="pay-sub mono">{v.plate} · {v.seats} seats · {v.tier}</div>
                </div>
              </div>
              <button className="btn-sm btn-danger" onClick={() => removeVehicle(v.id)}>Remove</button>
            </div>
          ))}
      </div>

      <div className="card">
        <div className="card-title">Recent completed trips</div>
        {trips.length === 0 ? <p className="muted" style={{ fontSize: '0.88rem' }}>No completed trips yet.</p>
          : trips.map((r) => (
            <div key={r.id} className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="pay-name" style={{ fontSize: '0.9rem' }}>{r.pickup_address} → {r.mode === 'hourly' ? `${r.duration_hours}h hire` : (r.dropoff_address || 'trip')}</div>
                <div className="pay-sub">{r.rider?.name || 'Rider'} · {r.tier}</div>
              </div>
              <span className="mono" style={{ fontWeight: 800 }}>${(r.final_fare || r.fare_estimate).toFixed(2)}</span>
            </div>
          ))}
      </div>

      <Modal open={modal} title="Add a vehicle" onClose={() => setModal(false)}>
        <div className="flex gap8">
          <div className="field" style={{ flex: 1 }}><label>Make</label><input className="input" value={veh.make} onChange={(e) => setVeh({ ...veh, make: e.target.value })} placeholder="Toyota" /></div>
          <div className="field" style={{ flex: 1 }}><label>Model</label><input className="input" value={veh.model} onChange={(e) => setVeh({ ...veh, model: e.target.value })} placeholder="Camry" /></div>
        </div>
        <div className="flex gap8">
          <div className="field" style={{ flex: 1 }}><label>Year</label><input className="input" type="number" value={veh.year} onChange={(e) => setVeh({ ...veh, year: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>Color</label><input className="input" value={veh.color} onChange={(e) => setVeh({ ...veh, color: e.target.value })} placeholder="Silver" /></div>
        </div>
        <div className="flex gap8">
          <div className="field" style={{ flex: 1 }}><label>Plate</label><input className="input" value={veh.plate} onChange={(e) => setVeh({ ...veh, plate: e.target.value })} placeholder="ABC-1234" /></div>
          <div className="field" style={{ flex: 1 }}><label>Seats</label><input className="input" type="number" value={veh.seats} onChange={(e) => setVeh({ ...veh, seats: e.target.value })} /></div>
        </div>
        <div className="field">
          <label>Service tier</label>
          <select className="input" value={veh.tier} onChange={(e) => setVeh({ ...veh, tier: e.target.value })}>
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={addVehicle}>Add vehicle</button>
      </Modal>
    </div>
  );
}
