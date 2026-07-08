import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionStatusCard from '../TransactionStatusCard';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!['animate', 'initial', 'exit', 'transition', 'whileHover'].includes(key) && (typeof value !== 'object' || value === null)) {
          safeProps[key] = value;
        }
      }
      return <div {...safeProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('TransactionStatusCard', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<TransactionStatusCard status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Pending state correctly', () => {
    render(<TransactionStatusCard status="pending" />);
    expect(screen.getByText('Waiting for confirmation...')).toBeInTheDocument();
  });

  it('renders Success state with Stellar Expert link', () => {
    render(
      <TransactionStatusCard status="success" hash="abc123def456" />
    );
    expect(screen.getByText('Transaction successful!')).toBeInTheDocument();
    expect(screen.getByText('View on Stellar Expert →')).toBeInTheDocument();
  });

  it('renders Failed state with error message', () => {
    render(
      <TransactionStatusCard status="failed" error="Insufficient funds" />
    );
    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
    expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
  });

  it('renders Simulating state correctly', () => {
    render(<TransactionStatusCard status="simulating" />);
    expect(screen.getByText('Simulating transaction...')).toBeInTheDocument();
  });
});
