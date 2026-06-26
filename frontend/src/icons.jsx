// Shared inline SVG icons (stroke = currentColor) for UCS Rides.
const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const CarIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M5 17h14l-1.5-5.5a2 2 0 0 0-1.9-1.5H8.4a2 2 0 0 0-1.9 1.5L5 17Z" />
    <path d="M3 17h18" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
  </svg>
);
export const ClockIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
export const PinIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const ListIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></svg>
);
export const WalletIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M16 12h2" /><path d="M3 9h14" /></svg>
);
export const UserIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const SteeringIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5V3.2M9.8 13.5l-5 3.8M14.2 13.5l5 3.8" /></svg>
);
export const StarIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}><path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.1 20.9l1.1-6.5L2.5 9.8l6.5-.9L12 2.5Z" /></svg>
);
export const PlusIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
export const ChevronIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><polyline points="9 18 15 12 9 6" /></svg>
);
export const CheckIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><polyline points="20 6 9 17 4 12" /></svg>
);
export const ShareIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
);
export const LogoutIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);
export const CrownIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7Z" /></svg>
);
export const UsersIcon = (p) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>
);
