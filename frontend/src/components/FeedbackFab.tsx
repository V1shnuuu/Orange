'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface/90 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition-colors hover:border-border-hover hover:bg-bg-surface-hover"
        aria-label="Leave feedback"
      >
        <MessageCircle size={16} />
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
