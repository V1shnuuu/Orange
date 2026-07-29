import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedbackModal from '../FeedbackModal';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (
          !['animate', 'initial', 'exit', 'transition', 'whileHover'].includes(key) &&
          (typeof value !== 'object' || value === null)
        ) {
          safeProps[key] = value;
        }
      }
      return <div {...safeProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('FeedbackModal', () => {
  it('renders nothing when closed', () => {
    render(<FeedbackModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Leave feedback')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<FeedbackModal isOpen onClose={() => {}} />);
    expect(screen.getByText('Leave feedback')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not submit the form when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen onClose={onClose} />);

    // A close button without type="button" would default to submit inside a
    // form, showing the success state instead of closing.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/feedback received/i)).not.toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape while closed', () => {
    const onClose = vi.fn();
    render(<FeedbackModal isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
