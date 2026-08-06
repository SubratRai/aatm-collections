import React from 'react';
import { useNotify } from './NotificationContext';

export function ToastStack() {
  const { items, dismiss } = useNotify();

  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
      {items.map((n) => (
        <div
          key={n.id}
          className={`toast toast-${n.type}${n.leaving ? ' toast-leave' : ''}`}
          role="status"
        >
          <span className="toast-message">{n.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss"
            onClick={() => dismiss(n.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
