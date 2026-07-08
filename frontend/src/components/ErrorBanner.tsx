'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AppError } from '@/lib/errors';

interface ErrorBannerProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
}

// Wallet install modal links
const WALLET_LINKS = [
  { name: 'Freighter', url: 'https://www.freighter.app/', icon: '🌊' },
  { name: 'xBull', url: 'https://xbull.app/', icon: '🐂' },
  { name: 'Albedo', url: 'https://albedo.link/', icon: '🌟' },
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowModal(false); onDismiss?.(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card border border-border rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">Wallet Required</h3>
              <p className="text-sm text-text-secondary mb-4">{error.message}</p>
              <div className="space-y-2">
                {WALLET_LINKS.map((w) => (
                  <a
                    key={w.name}
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/50 hover:bg-bg-surface transition-colors"
                  >
                    <span className="text-xl">{w.icon}</span>
                    <span className="text-sm font-medium text-text-primary">{w.name}</span>
                    <span className="ml-auto text-xs text-accent">Install →</span>
                  </a>
                ))}
              </div>
              <button
                onClick={() => { setShowModal(false); onDismiss?.(); }}
                className="mt-4 w-full btn-secondary text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // User rejected — yellow dismissible banner
  if (error.type === 'user_rejected') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-between p-3 rounded-lg bg-warning-bg border border-warning/20"
      >
        <p className="text-sm text-warning">{error.message}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-warning/70 hover:text-warning ml-3 text-lg leading-none">&times;</button>
        )}
      </motion.div>
    );
  }

  // Insufficient balance — inline block
  if (error.type === 'insufficient_balance') {
    return (
      <div className="p-3 rounded-lg bg-error-bg border border-error/20">
        <p className="text-sm text-error font-medium">{error.message}</p>
      </div>
    );
  }

  // Invalid shares — red inline
  if (error.type === 'invalid_shares') {
    return (
      <div className="p-2 rounded bg-error-bg border border-error/20">
        <p className="text-xs text-error">{error.message}</p>
      </div>
    );
  }

  // Split exists — inline field error
  if (error.type === 'split_exists') {
    return (
      <p className="text-xs text-error mt-1">{error.message}</p>
    );
  }

  // Contract error — red inline card
  if (error.type === 'contract_error') {
    return (
      <div className="p-3 rounded-lg bg-error-bg border border-error/20">
        <p className="text-sm text-error font-medium">Contract Error</p>
        <p className="text-xs text-error/80 mt-1">{error.message}</p>
      </div>
    );
  }

  // Network timeout — toast with retry
  if (error.type === 'network_timeout') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-3 rounded-lg bg-warning-bg border border-warning/20 flex items-center justify-between"
      >
        <p className="text-sm text-warning">{error.message}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-warning font-medium hover:underline ml-3 whitespace-nowrap">
            Retry
          </button>
        )}
      </motion.div>
    );
  }

  return null;
}
