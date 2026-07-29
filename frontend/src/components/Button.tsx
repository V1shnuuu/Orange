import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Bright green pill — the single primary action colour
  primary:
    'bg-accent text-[#04120a] hover:bg-accent-hover hover:-translate-y-px active:translate-y-0',
  // Solid white pill — paired secondary CTA
  secondary:
    'bg-white text-black hover:bg-[#e9e9ec] hover:-translate-y-px active:translate-y-0',
  outline:
    'bg-transparent text-text-primary border border-border hover:border-border-hover hover:bg-bg-surface',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface',
  danger:
    'bg-error/12 text-error border border-error/30 hover:bg-error/20 hover:border-error/50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-[52px] px-8 text-[15px] gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-all duration-200 ease-out disabled:opacity-40 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
