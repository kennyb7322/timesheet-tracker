const BASE = '/api';
const TOKEN_KEY = 'ucs_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  if (res.status === 401) {
    setToken(null);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export const signup = (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
export const login = (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const fetchMe = () => request('/auth/me');
export const updateMe = (data) => request('/auth/me', { method: 'PUT', body: JSON.stringify(data) });

// ── Rides ─────────────────────────────────────────────
export const quote = (data) => request('/rides/quote', { method: 'POST', body: JSON.stringify(data) });
export const nearbyDrivers = (lat, lng, tier) => {
  const qs = new URLSearchParams({ lat, lng });
  if (tier) qs.set('tier', tier);
  return request(`/rides/nearby?${qs}`);
};
export const createRide = (data) => request('/rides/', { method: 'POST', body: JSON.stringify(data) });
export const myRides = (status) => request(`/rides/${status ? `?status=${status}` : ''}`);
export const getRide = (id) => request(`/rides/${id}`);
export const cancelRide = (id) => request(`/rides/${id}/cancel`, { method: 'POST' });
export const payRide = (id) => request(`/rides/${id}/pay`, { method: 'POST' });

// ── Driver ────────────────────────────────────────────
export const availableRides = () => request('/rides/available');
export const drivingRides = () => request('/rides/driving');
export const acceptRide = (id) => request(`/rides/${id}/accept`, { method: 'POST' });
export const setRideStatus = (id, status) => request(`/rides/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
export const setOnline = (is_online, lat, lng) => request('/drivers/online', { method: 'POST', body: JSON.stringify({ is_online, lat, lng }) });
export const myVehicles = () => request('/drivers/vehicles');
export const addVehicle = (data) => request('/drivers/vehicles', { method: 'POST', body: JSON.stringify(data) });
export const deleteVehicle = (id) => request(`/drivers/vehicles/${id}`, { method: 'DELETE' });
export const earnings = () => request('/drivers/earnings');

// ── Payments ──────────────────────────────────────────
export const paymentMethods = () => request('/payments/methods');
export const paymentHistory = () => request('/payments/history');
