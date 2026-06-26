import { useState } from 'react';
import * as api from '../api/client';
import { useAuth } from '../auth';
import { StarIcon, LogoutIcon, SteeringIcon, UserIcon } from '../icons';

export default function AccountPage({ toast }) {
  const { user, logout, patchUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [rate, setRate] = useState(user.hourly_rate || 45);
  const [saving, setSaving] = useState(false);

  const isDriver = user.role === 'driver' || user.role === 'both';

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name, phone };
      if (isDriver) payload.hourly_rate = parseFloat(rate) || 45;
      const u = await api.updateMe(payload);
      patchUser(u);
      toast('Profile saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const becomeDriver = async () => {
    try {
      const u = await api.updateMe({ role: 'both' });
      patchUser(u);
      toast('You can now drive with UCS! Switch to driver mode up top.', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="page">
      <div className="card center">
        <div className="avatar" style={{ background: user.avatar_color, width: 72, height: 72, fontSize: '1.8rem', margin: '4px auto 12px' }}>
          {user.name.charAt(0)}
        </div>
        <div className="section-title" style={{ marginBottom: 2 }}>{user.name}</div>
        <div className="muted">{user.email}</div>
        <div className="flex gap8" style={{ justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <StarIcon style={{ width: 15, height: 15, color: 'var(--gold)' }} />
          <span style={{ fontWeight: 700 }}>{user.rating.toFixed(2)}</span>
          <span className="pill" style={{ textTransform: 'capitalize' }}>{user.role}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Profile</div>
        <div className="field"><label>Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field" style={{ marginBottom: isDriver ? 14 : 0 }}><label>Phone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
        {isDriver && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Your hourly rate (time-hire) — $/hr</label>
            <input className="input mono" type="number" min="20" max="200" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={save} disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save changes'}
        </button>
      </div>

      {!isDriver && (
        <div className="card">
          <div className="flex gap8" style={{ alignItems: 'center', marginBottom: 10 }}>
            <SteeringIcon style={{ width: 22, height: 22, color: 'var(--accent)' }} />
            <div>
              <div className="pay-name">Drive with UCS</div>
              <div className="pay-sub">Earn on your schedule — single trips or time-hire.</div>
            </div>
          </div>
          <button className="btn btn-dark" onClick={becomeDriver}>Become a driver</button>
        </div>
      )}

      <button className="btn btn-ghost" onClick={() => { logout(); toast('Signed out', 'info'); }}>
        <LogoutIcon style={{ width: 18, height: 18 }} /> Sign out
      </button>
      <div className="center muted" style={{ marginTop: 18, fontSize: '0.78rem' }}>
        UCS Rides · a UC Solutions product
      </div>
    </div>
  );
}
