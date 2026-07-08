import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBanner from '../ErrorBanner';
import type { AppError } from '@/lib/errors';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { _animate, _initial, _exit, _transition, ...rest } = props as Record<string, unknown>;
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== 'object' || value === null) {
          safeProps[key] = value;
        }
      }
      return <div {...safeProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('ErrorBanner', () => {
  it('renders wallet not installed as modal with install links', () => {
    const error: AppError = {
      type: 'wallet_not_installed',
      message: 'No Stellar wallet detected.',
      retryable: false,
    };

    render(<ErrorBanner error={error} />);
    expect(screen.getByText('Wallet Required')).toBeInTheDocument();
    expect(screen.getByText('Freighter')).toBeInTheDocument();
    expect(screen.getByText('xBull')).toBeInTheDocument();
    expect(screen.getByText('Albedo')).toBeInTheDocument();
  });

  it('renders user rejected as yellow dismissible banner', () => {
    const error: AppError = {
      type: 'user_rejected',
      message: 'Transaction cancelled — nothing was sent.',
      retryable: false,
    };

    render(<ErrorBanner error={error} onDismiss={() => {}} />);
    expect(screen.getByText('Transaction cancelled — nothing was sent.')).toBeInTheDocument();
  });

  it('renders insufficient balance as inline block', () => {
    const error: AppError = {
      type: 'insufficient_balance',
      message: 'Insufficient USDC balance.',
      retryable: false,
    };

    render(<ErrorBanner error={error} />);
    expect(screen.getByText('Insufficient USDC balance.')).toBeInTheDocument();
  });

  it('renders contract error with detailed message', () => {
    const error: AppError = {
      type: 'contract_error',
      message: 'Shares must sum to exactly 100%.',
      code: 3,
      retryable: false,
    };

    render(<ErrorBanner error={error} />);
    expect(screen.getByText('Contract Error')).toBeInTheDocument();
    expect(screen.getByText('Shares must sum to exactly 100%.')).toBeInTheDocument();
  });

  it('renders network timeout with retry button', () => {
    const onRetry = vi.fn();
    const error: AppError = {
      type: 'network_timeout',
      message: 'Network error — unable to reach the Stellar network.',
      retryable: true,
    };

    render(<ErrorBanner error={error} onRetry={onRetry} />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
