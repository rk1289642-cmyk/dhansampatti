import React from 'react';

const STATUS_COLOR: Record<string, string> = {
  'Lead Created':    'badge-blue',
  'Login':           'badge-amber',
  'Sanction':        'badge-green',
  'Disbursal':       'badge-purple',
  'Rejected':        'badge-red',
  'Legal & Technical': 'badge-gray',
  'Transaction':     'badge-gray',
  'PDD Clearance':   'badge-gray',
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_COLOR[status] ?? 'badge-gray'}`}>{status}</span>;
}
