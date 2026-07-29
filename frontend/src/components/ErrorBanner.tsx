'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, X } from 'lucide-react';
import type { AppError } from '@/lib/errors';
import Button from '@/components/Button';

interface ErrorBannerProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const WALLET_LINKS = [
  { name: 'Freighter', url: 'https://www.freighter.app/' },
  { name: 'xBull', url: 'https://xbull.app/' },
  { name: 'Albedo', url: 'https://albedo.link/' },
];

export default function ErrorBanner({ error, onDismiss, onRetry }: ErrorBannerProps) {
  const [showModal, setShowModal] = useState(error.type === 'wallet_not_installed');

  // Wallet not installed — full modal
  if (error.type === 'wallet_not_installed') {
    return (
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={() => {
              setShowModal(false);
              onDismiss?.();
            }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-bg-card p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="iris-bloom"
                style={{ width: 260, height: 260, top: -180, right: -50, opacity: 0.2 }}
                aria-hidden="true"
              />
              <div className="relative">
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">
                  Wallet required
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                  {error.message}
                </p>
                <div className="space-y-2">
                  {WALLET_LINKS.map((w) => (
                    <a
                      key={w.name}
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-border bg-bg-surface px-4 py-3 transition-colors hover:border-border-hover hover:bg-bg-surface-hover"
                    >
                      <span className="text-sm font-medium text-white">{w.name}</span>
                      <ExternalLink size={13} className="ml-auto text-text-muted" />
                    </a>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    onDismiss?.();
                  }}
                  className="mt-5 w-full"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // User rejected — dismissible warning banner
  if (error.type === 'user_rejected') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-3.5"
      >
        <p className="text-sm text-warning">{error.message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-warning/70 transition-colors hover:text-warning"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        )}
      </motion.div>
    );
  }

  // Insufficient balance
  if (error.type === 'insufficient_balance') {
    return (
      <div className="rounded-2xl border border-error/25 bg-error/10 p-3.5">
        <p className="text-sm font-medium text-error">{error.message}</p>
      </div>
    );
  }

  // Invalid shares — compact inline
  if (error.type === 'invalid_shares') {
    return (
      <div className="rounded-xl border border-error/25 bg-error/10 px-3 py-2">
        <p className="text-xs text-error">{error.message}</p>
      </div>
    );
  }

  // Split exists — field-level error
  if (error.type === 'split_exists') {
    return <p className="mt-1 text-xs text-error">{error.message}</p>;
  }

  // Contract error
  if (error.type === 'contract_error') {
    return (
      <div className="rounded-2xl border border-error/25 bg-error/10 p-3.5">
        <p className="text-sm font-medium text-error">Contract error</p>
        <p className="mt-1 text-xs text-error/80">{error.message}</p>
      </div>
    );
  }

  // Network timeout — with retry
  if (error.type === 'network_timeout') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-3.5"
      >
        <p className="text-sm text-warning">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 text-xs font-medium text-warning hover:underline"
          >
            Retry
          </button>
        )}
      </motion.div>
    );
  }

  return null;
}
