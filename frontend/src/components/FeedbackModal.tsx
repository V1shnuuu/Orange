'use client';

import { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real MVP, send this to an API or Discord webhook
    console.log('Feedback submitted:', feedback);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedback('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-bg-primary border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h2 className="text-xl font-bold text-text-primary mb-2">Leave Feedback</h2>
        <p className="text-sm text-text-secondary mb-6">
          Help us improve CirclePact! Let us know what features you want to see or what issues you encountered.
        </p>

        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <span className="text-green-400 font-medium">Thank you for your feedback! 🚀</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your thoughts..."
              className="w-full bg-bg-secondary border border-border rounded-xl p-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent min-h-[120px] resize-none"
              required
            />
            <button
              type="submit"
              className="bg-accent text-bg-primary font-semibold py-3 px-4 rounded-xl hover:bg-accent/90 transition-colors"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
