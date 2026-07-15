'use client';

import { motion } from 'motion/react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Generic empty state for lists, search results, and data views.
 * Accepts an optional action button to guide the user to a next step.
 */
export default function EmptyState({ icon = '🔍', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4 bg-bg-card border border-border rounded-xl"
    >
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs mx-auto mb-6">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm">
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
