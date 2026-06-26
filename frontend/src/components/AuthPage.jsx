import { useState } from 'react';
import { useAuth } from '../auth';
import { UserIcon, SteeringIcon, UsersIcon } from '../icons';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [role, setRole] = useState('rider');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
      } else {
        await signup({ ...form, email: form.email.trim(), role });
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (email) => setForm((f) => ({ ...f, email, password: 'password123' }));

  return (
    <div className="auth-wrap">
      <div className="auth-logo">UC</div>
      <h1 className="auth-title">UCS Rides</h1>
      <p className="auth-sub">
        {mode === 'login'
          ? 'Welcome back. Book a ride or hire a driver by the hour.'
          : 'Create your account to ride or drive with UCS.'}
      </p>

      {err && <div className="err-msg">{err}</div>}

      <form onSubmit={submit}>
        {mode === 'signup' && (
          <>
            <div className="role-pick">
              <button type="button" className={role === 'rider' ? 'active' : ''} onClick={() => setRole('rider')}>
                <UserIcon style={{ width: 22, height: 22 }} /><div>Rider</div><small>Book rides</small>
              </button>
              <button type="button" className={role === 'driver' ? 'active' : ''} onClick={() => setRole('driver')}>
                <SteeringIcon style={{ width: 22, height: 22 }} /><div>Driver</div><small>Earn money</small>
              </button>
              <button type="button" className={role === 'both' ? 'active' : ''} onClick={() => setRole('both')}>
                <UsersIcon style={{ width: 22, height: 22 }} /><div>Both</div><small>Ride & drive</small>
              </button>
            </div>
            <div className="field">
              <label>Full name</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Alex Rivera" required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="(555) 123-4567" />
            </div>
          </>
        )}
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} />
        </div>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? <span className="spinner" /> : (mode === 'login' ? 'Log in' : 'Create account')}
        </button>
      </form>

      <div className="auth-switch">
        {mode === 'login' ? "New to UCS Rides? " : 'Already have an account? '}
        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </div>

      <div className="demo-hint">
        <b>Try the demo:</b> tap to fill, then log in.<br />
        <button className="btn-sm btn-ghost" style={{ marginTop: 8, marginRight: 8 }} onClick={() => fillDemo('rider@ucsrides.com')}>Demo rider</button>
        <button className="btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={() => fillDemo('driver@ucsrides.com')}>Demo driver</button>
      </div>
    </div>
  );
}
