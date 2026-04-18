import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success' }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div className={`toast ${type}`}>{message}</div>;
}
