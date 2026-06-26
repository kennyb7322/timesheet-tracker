import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth';
import AuthPage from './components/AuthPage';
import RiderHome from './components/RiderHome';
import ActivityPage from './components/ActivityPage';
import PaymentsPage from './components/PaymentsPage';
import AccountPage from './components/AccountPage';
import DriverDashboard from './components/DriverDashboard';
import DriverEarnings from './components/DriverEarnings';
import Toast from './components/Toast';
import { CarIcon, ListIcon, WalletIcon, UserIcon, SteeringIcon, ShareIcon } from './icons';

const RIDER_TABS = [
  { key: 'ride', label: 'Ride', Icon: CarIcon, Page: RiderHome },
  { key: 'trips', label: 'Trips', Icon: ListIcon, Page: ActivityPage },
  { key: 'wallet', label: 'Wallet', Icon: WalletIcon, Page: PaymentsPage },
  { key: 'account', label: 'Account', Icon: UserIcon, Page: AccountPage },
];
const DRIVER_TABS = [
  { key: 'drive', label: 'Drive', Icon: SteeringIcon, Page: DriverDashboard },
  { key: 'earnings', label: 'Earnings', Icon: WalletIcon, Page: DriverEarnings },
  { key: 'account', label: 'Account', Icon: UserIcon, Page: AccountPage },
];

function Shell() {
  const { user } = useAuth();
  const canDrive = user.role === 'driver' || user.role === 'both';
  const canRide = user.role === 'rider' || user.role === 'both';

  const [mode, setMode] = useState(canRide ? 'rider' : 'driver');
  const tabs = mode === 'driver' ? DRIVER_TABS : RIDER_TABS;
  const [tab, setTab] = useState(tabs[0].key);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type, k: Date.now() });

  // Keep the active tab valid when switching modes.
  useEffect(() => { setTab((mode === 'driver' ? DRIVER_TABS : RIDER_TABS)[0].key); }, [mode]);

  const Page = tabs.find((t) => t.key === tab)?.Page || tabs[0].Page;

  const share = async () => {
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: 'UCS Rides', text: 'Ride or hire a driver by the hour with UCS Rides', url });
      else { await navigator.clipboard.writeText(url); showToast('Link copied', 'info'); }
    } catch { /* cancelled */ }
  };

  const toggleMode = () => setMode((m) => (m === 'rider' ? 'driver' : 'rider'));

  return (
    <div className="app-shell">
      {toast && <Toast key={toast.k} message={toast.msg} type={toast.type} />}

      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">UC</div>
          <div className="header-title">UCS Rides<small>{mode === 'driver' ? 'Driver' : 'by UC Solutions'}</small></div>
        </div>
        <div className="flex gap8">
          {canRide && canDrive && (
            <button className="btn-sm btn-ghost" onClick={toggleMode} style={{ fontWeight: 700 }}>
              {mode === 'rider' ? 'Drive' : 'Ride'}
            </button>
          )}
          <button className="icon-btn" onClick={share} aria-label="Share"><ShareIcon /></button>
        </div>
      </header>

      <Page toast={showToast} />

      <nav className="bottom-nav">
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <Icon /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-load" style={{ minHeight: '100dvh' }}><span className="spinner" /></div>;
  return user ? <Shell /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
