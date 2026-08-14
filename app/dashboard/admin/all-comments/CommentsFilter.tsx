'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CommentsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status_id') || '';
  
  const [statuses, setStatuses] = useState<{ id: number, lead_status: string }[]>([]);

  useEffect(() => {
    fetch('/api/meta')
      .then(r => r.json())
      .then(data => setStatuses(data.leadStatuses || []))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set('status_id', val);
    } else {
      params.delete('status_id');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="table-toolbar" style={{ marginBottom: '20px' }}>
      <div className="toolbar-filters">
        <select 
          value={currentStatus} 
          onChange={handleChange} 
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => (
            <option key={s.id} value={s.id}>{s.lead_status}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
