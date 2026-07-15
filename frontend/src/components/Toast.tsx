'use client';

import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  /** Duration in ms before auto-dismissing. 0 = stay until manually closed. */
  duration?: number;
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string }> = {
  success: { border: 'border-accent/40', icon: '✓' },
  error:   { border: 'border-red-500/40', icon: '✕' },
  info:    { border: 'border-blue-400/40', icon: 'ℹ' },
  warning: { border: 'border-yellow-400/40', icon: '⚠' },
};

const ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-accent',
  error:   'text-red-400',
  info:    'text-blue-400',
  warning: 'text-yellow-400',
};

export function Toast({ id, message, variant = 'info', duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  const { border, icon } = VARIANT_STYLES[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border bg-bg-primary/95 backdrop-blur-md px-4 py-3 shadow-lg transition-all duration-300 ${border} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className={`text-base font-bold leading-none mt-0.5 ${ICON_COLOR[variant]}`}>{icon}</span>
      <p className="flex-1 text-sm text-text-primary leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

/** Renders a stack of Toast notifications in the bottom-right corner. */
export interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onDismiss'>[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 w-80 max-w-[calc(100vw-3rem)]"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
