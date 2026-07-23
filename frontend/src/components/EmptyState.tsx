'use client';

import React from 'react';
import { motion } from 'motion/react';

type EmptyStateAction = React.ReactNode | { label: string; onClick?: () => void };

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

function renderAction(action: EmptyStateAction) {
  if (!action) return null;

  if (React.isValidElement(action)) {
    return action;
  }

  if (typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action) {
    const { label, onClick } = action as { label: string; onClick?: () => void };
    return (
      <button type="button" onClick={onClick} className="btn btn-primary">
        {label}
      </button>
    );
  }

  return <div>{action as React.ReactNode}</div>;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-bg-card/50"
    >
      {/* Visual illustration element */}
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border border-dashed border-border rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-2 bg-accent/5 rounded-full blur-xl"
        />
        <div className="relative text-4xl">{icon || '🔍'}</div>
      </div>
      
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-sm mb-8 leading-relaxed text-sm">
        {description}
      </p>
      {renderAction(action)}
    </motion.div>
  );
}
