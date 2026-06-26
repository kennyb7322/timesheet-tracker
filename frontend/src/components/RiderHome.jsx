import { useState, useEffect } from 'react';
import * as api from '../api/client';
import BookingFlow from './BookingFlow';
import RideTracking from './RideTracking';

const ACTIVE = ['requested', 'accepted', 'arriving', 'in_progress'];

export default function RiderHome({ toast }) {
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, resume any in-flight ride.
  useEffect(() => {
    api.myRides()
      .then((rides) => {
        const live = rides.find((r) => ACTIVE.includes(r.status)
          || (r.status === 'completed' && r.payment_status !== 'paid'));
        if (live) setActiveRide(live);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center-load"><span className="spinner" /></div>;

  if (activeRide) {
    return <RideTracking ride={activeRide} toast={toast} onDone={() => setActiveRide(null)} />;
  }
  return <BookingFlow toast={toast} onBooked={setActiveRide} />;
}
