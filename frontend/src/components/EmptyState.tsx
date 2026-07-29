'use client';

import React from 'react';
import { motion } from 'motion/react';

type EmptyStateAction = React.ReactNode | { label: string; onClick?: () => void };

interface EmptyStateProps {
  /** Emoji or a rendered icon node. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

function renderAction(action: EmptyStateAction) {
  if (!action) return null;

  if (React.isValidElement(action)) {
    return action;
  }

  if (typeof action === 'object' && action !== null && 'label' in action) {
    const { label, onClick } = action as { label: string; onClick?: () => void };
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-[#04120a] transition-colors hover:bg-accent-hover"
      >
        {label}
      </button>
    );
  }

  return <>{action as React.ReactNode}</>;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border bg-bg-card/60 px-6 py-20 text-center"
    >
      <div
        className="iris-bloom iris-bloom-centered"
        style={{ width: 320, height: 320, top: -180, left: '50%', opacity: 0.14 }}
        aria-hidden="true"
      />

      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-bg-surface text-2xl">
        {icon ?? '○'}
      </div>

      <h3 className="relative mb-2 text-xl font-semibold tracking-tight text-white">
        {title}
      </h3>
      {description && (
        <p className="relative mb-8 max-w-sm text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
      <div className="relative">{renderAction(action)}</div>
    </motion.div>
  );
}
