'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  /** Duration in ms before auto-dismissing. 0 = stay until manually closed. */
  duration?: number;
  onDismiss: (id: string) => void;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { className: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  success: { className: 'border-accent/30 text-accent', Icon: CheckCircle2 },
  error: { className: 'border-error/30 text-error', Icon: XCircle },
  info: { className: 'border-info/30 text-info', Icon: Info },
  warning: { className: 'border-warning/30 text-warning', Icon: AlertTriangle },
};

export function Toast({
  id,
  message,
  variant = 'info',
  duration = 4000,
  onDismiss,
}: ToastProps) {
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

  const { className, Icon } = VARIANT_CONFIG[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl border bg-bg-surface/95 px-4 py-3.5 shadow-lg backdrop-blur-xl transition-all duration-300 ${className} ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <span className="mt-0.5 shrink-0">
        <Icon size={16} />
      </span>
      <p className="flex-1 text-sm leading-snug text-white">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-text-muted transition-colors hover:text-white"
        aria-label="Dismiss notification"
      >
        <X size={15} />
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
      className="fixed bottom-6 right-6 z-[200] flex w-80 max-w-[calc(100vw-3rem)] flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
