import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReputationBadge from '../ReputationBadge';

describe('ReputationBadge', () => {
  it('renders nothing when tier is None', () => {
    const { container } = render(<ReputationBadge tier="None" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Bronze badge with correct text and icon when showLabel is true', () => {
    const { container } = render(<ReputationBadge tier="Bronze" showLabel />);
    expect(screen.getByText('Bronze')).toBeDefined();
    expect(container.querySelector('svg.lucide-medal')).not.toBeNull();
  });

  it('renders Diamond badge with correct text and icon when showLabel is true', () => {
    const { container } = render(<ReputationBadge tier="Diamond" showLabel />);
    expect(screen.getByText('Diamond')).toBeDefined();
    expect(container.querySelector('svg.lucide-gem')).not.toBeNull();
  });
});
