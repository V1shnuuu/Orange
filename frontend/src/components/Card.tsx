import React, { ComponentPropsWithoutRef } from 'react';
import { motion } from 'motion/react';

interface CardProps
  extends Omit<
    ComponentPropsWithoutRef<'div'>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
  > {
  children: React.ReactNode;
  animate?: boolean;
  delay?: number;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = '',
  animate = false,
  delay = 0,
  hoverable = false,
  ...props
}: CardProps) {
  const baseClasses = `glass-card ${
    hoverable ? 'hover:border-accent/30 transition-all group' : ''
  } ${className}`;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={baseClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
}
