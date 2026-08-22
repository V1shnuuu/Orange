'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import Button from './Button';
import { useWallet } from './WalletProvider';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { publicKey } = useWallet();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: feedback,
          wallet: publicKey ?? undefined,
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Could not send feedback.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFeedback('');
        onClose();
      }, 2000);
    } catch (err) {
      // Only claim it was received once it actually was.
      setError(err instanceof Error ? err.message : 'Could not send feedback.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Leave feedback"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-bg-card p-7 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="iris-bloom"
              style={{ width: 280, height: 280, top: -190, right: -60, opacity: 0.18 }}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/8 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="relative">
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">
                Leave feedback
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                Tell us what to build next, or what got in your way.
              </p>

              {submitted ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-sm font-medium text-accent">
                  <Check size={16} />
                  Thanks — feedback received.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Your thoughts…"
                    className="input-field min-h-[128px] resize-none"
                    required
                  />
                  {error && (
                    <p
                      role="alert"
                      className="rounded-xl border border-error/30 bg-error-bg px-3 py-2 text-xs leading-relaxed text-error"
                    >
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isSending}>
                    {isSending ? 'Sending…' : 'Submit feedback'}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
