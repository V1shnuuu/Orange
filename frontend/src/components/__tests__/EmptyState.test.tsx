import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders title correctly', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('renders description if provided', () => {
    render(<EmptyState title="Title" description="Some description here" />);
    expect(screen.getByText('Some description here')).toBeTruthy();
  });

  it('renders default icon if not provided', () => {
    render(<EmptyState title="Title" />);
    expect(screen.getByText('🔍')).toBeTruthy();
  });

  it('renders custom icon if provided', () => {
    render(<EmptyState title="Title" icon="🚀" />);
    expect(screen.getByText('🚀')).toBeTruthy();
  });

  it('renders action button and triggers onClick', () => {
    const onClickMock = vi.fn();
    render(
      <EmptyState
        title="Title"
        action={{ label: 'Create New', onClick: onClickMock }}
      />
    );
    
    const button = screen.getByText('Create New');
    expect(button).toBeTruthy();
    
    fireEvent.click(button);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
