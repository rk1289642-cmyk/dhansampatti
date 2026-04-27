'use client';

import { useEffect, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  msg: string;
  type: ToastType;
}

// Global singleton event bus
type Listener = (toast: Omit<ToastMessage, 'id'>) => void;
const listeners: Listener[] = [];
let nextId = 0;

export function toast(msg: string, type: ToastType = 'success') {
  listeners.forEach(fn => fn({ msg, type }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    listeners.push(add);
    return () => {
      const idx = listeners.indexOf(add);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, [add]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {t.type === 'error' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
          {t.type === 'info' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
