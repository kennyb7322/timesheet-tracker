import { CarIcon } from '../icons';

// Project a lat/lng to a percentage position inside the map box, centered on `center`.
function project(lat, lng, center, span = 0.03) {
  const x = 50 + ((lng - center.lng) / span) * 100;
  const y = 50 - ((lat - center.lat) / span) * 100;
  return { left: `${Math.max(6, Math.min(94, x))}%`, top: `${Math.max(8, Math.min(92, y))}%` };
}

export default function MapView({ center, drivers = [], pickupLabel = 'Pickup', tall = false, badge }) {
  return (
    <div className={`map map-roads ${tall ? 'tall' : ''}`}>
      {badge && (
        <div className="map-badge"><span className="dot" />{badge}</div>
      )}

      {drivers.map((d) => {
        const pos = project(d.lat ?? d.current_lat, d.lng ?? d.current_lng, center);
        return (
          <div key={d.id} className="map-car" style={{ ...pos, color: d.avatar_color || '#16E0A3' }}>
            <CarIcon />
          </div>
        );
      })}

      <div className="map-pin" style={{ left: '50%', top: '50%' }}>
        <div className="pin-dot" />
        <div className="pin-label">{pickupLabel}</div>
      </div>
    </div>
  );
}
