import { useState, useEffect } from 'react';
import * as api from '../api/client';
import { useAuth } from '../auth';
import { PAY_META, PAY_ORDER } from '../payments';
import { WalletIcon, CheckIcon } from '../icons';

const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function PaymentsPage({ toast }) {
  const { user, patchUser } = useAuth();
  const [methods, setMethods] = useState([]);
  const [history, setHistory] = useState(null);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    api.paymentMethods().then(setMethods).catch(() => {});
    api.paymentHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const setDefault = async (m) => {
    setSaving(m);
    try {
      await api.updateMe({ default_payment_method: m });
      patchUser({ default_payment_method: m });
      toast(`${PAY_META[m].label} set as default`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(''); }
  };

  return (
    <div className="page">
      <h1 className="section-title">Wallet</h1>
      <p className="section-sub">Pay your way — Cash App, Venmo, PayPal, Zelle, or card.</p>

      <div className="card">
        <div className="card-title">Default payment method</div>
        <div className="pay-grid">
          {PAY_ORDER.map((m) => {
            const meta = PAY_META[m];
            const info = methods.find((x) => x.method === m);
            const active = user?.default_payment_method === m;
            return (
              <button key={m} className={`pay-chip ${active ? 'active' : ''}`} onClick={() => setDefault(m)} disabled={saving === m}>
                <div className="pay-logo" style={{ background: meta.bg }}>{meta.short}</div>
                <div style={{ flex: 1 }}>
                  <div className="pay-name">{meta.label}</div>
                  <div className="pay-sub">{info?.handle || meta.sub}</div>
                </div>
                {active && <CheckIcon style={{ width: 18, height: 18, color: 'var(--accent)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Payment history</div>
        {!history ? <div className="center-load"><span className="spinner" /></div>
          : history.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}><WalletIcon /><p>No payments yet.</p></div>
          ) : history.map((p) => (
            <div key={p.id} className="row-between" style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex gap8" style={{ alignItems: 'center' }}>
                <div className="pay-logo" style={{ background: PAY_META[p.method]?.bg, width: 30, height: 30, fontSize: '0.75rem' }}>{PAY_META[p.method]?.short}</div>
                <div>
                  <div className="pay-name" style={{ fontSize: '0.85rem' }}>Ride #{p.ride_id}</div>
                  <div className="pay-sub">{fmt(p.created_at)} · {p.status}</div>
                </div>
              </div>
              <span className="mono" style={{ fontWeight: 800 }}>${p.amount.toFixed(2)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
