import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FeedbackModal from '../FeedbackModal';

// The modal reads the connected wallet to attach it to the submission.
vi.mock('../WalletProvider', () => ({
  useWallet: () => ({ publicKey: null }),
}));

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

describe('FeedbackModal submission', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const submit = async (text = 'the join button was confusing') => {
    const textarea = screen.getByPlaceholderText('Your thoughts…');
    fireEvent.change(textarea, { target: { value: text } });
    fireEvent.submit(textarea.closest('form')!);
  };

  it('posts the feedback to the API', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<FeedbackModal isOpen onClose={() => {}} />);
    await submit('the join button was confusing');

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));

    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/feedback');
    expect(JSON.parse(init.body).message).toBe('the join button was confusing');
  });

  it('surfaces the error instead of claiming the feedback was received', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Feedback storage is not configured.' }),
    });

    render(<FeedbackModal isOpen onClose={() => {}} />);
    await submit();

    // The old console.log build always showed the thank-you screen, even
    // though nothing was ever stored.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Feedback storage is not configured.'
    );
    expect(screen.queryByText(/thank/i)).not.toBeInTheDocument();
  });

  it('does not close the modal when delivery fails', async () => {
    const onClose = vi.fn();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network down')
    );

    render(<FeedbackModal isOpen onClose={onClose} />);
    await submit();

    await screen.findByRole('alert');
    expect(onClose).not.toHaveBeenCalled();
  });
});
