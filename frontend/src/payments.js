// Display metadata for each supported payment method.
export const PAY_META = {
  cashapp: { label: 'Cash App', short: '$', bg: '#00D632', sub: 'Instant transfer' },
  venmo:   { label: 'Venmo',    short: 'V', bg: '#3D95CE', sub: 'Instant transfer' },
  paypal:  { label: 'PayPal',   short: 'P', bg: '#003087', sub: 'Send to handle' },
  zelle:   { label: 'Zelle',    short: 'Z', bg: '#6D1ED4', sub: 'Bank transfer' },
  stripe:  { label: 'Card',     short: '⬤', bg: '#635BFF', sub: 'Credit / debit' },
  cash:    { label: 'Cash',     short: '$', bg: '#16A34A', sub: 'Pay driver direct' },
};

export const PAY_ORDER = ['stripe', 'cashapp', 'venmo', 'paypal', 'zelle', 'cash'];
