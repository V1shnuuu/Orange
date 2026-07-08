import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SplitBuilder from '../SplitBuilder';

// Mock motion/react to avoid animation issues in tests
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

describe('SplitBuilder', () => {
  it('shows error state when shares sum to more than 100', () => {
    const recipients = [
      { address: 'GBZX4TKKRMQNFTO2H', share: 60 },
      { address: 'GCRW8J5TNPLQX2WDK', share: 50 },
    ];

    render(
      <SplitBuilder
        recipients={recipients}
        onUpdateRecipient={() => {}}
        onAddRecipient={() => {}}
        onRemoveRecipient={() => {}}
      />
    );

    // Total should show 110%
    const totalEl = screen.getByTestId('total-shares');
    expect(totalEl.textContent).toBe('110%');

    // Error message should be visible
    const errorEl = screen.getByTestId('shares-error');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.textContent).toContain('exceed 100%');
  });

  it('shows valid state when shares sum to exactly 100', () => {
    const recipients = [
      { address: 'GBZX4TKKRMQNFTO2H', share: 60 },
      { address: 'GCRW8J5TNPLQX2WDK', share: 40 },
    ];

    render(
      <SplitBuilder
        recipients={recipients}
        onUpdateRecipient={() => {}}
        onAddRecipient={() => {}}
        onRemoveRecipient={() => {}}
      />
    );

    const totalEl = screen.getByTestId('total-shares');
    expect(totalEl.textContent).toBe('100%');

    // No error should be shown
    expect(screen.queryByTestId('shares-error')).not.toBeInTheDocument();
  });
});
