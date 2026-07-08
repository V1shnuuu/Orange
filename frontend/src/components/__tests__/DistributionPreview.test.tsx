import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DistributionPreview from '../DistributionPreview';

describe('DistributionPreview', () => {
  it('renders correct per-recipient amounts', () => {
    const recipients = [
      { address: 'GBZX4TKKRMQNFTO2HKPXS4TH6HNCQB', share: 50 },
      { address: 'GCRW8J5TNPLQX2WDKFZ9M7B3CGHJKZ', share: 30 },
      { address: 'GAZX6N9KLPD4MWCFQYH5TBRJVGZKRM', share: 20 },
    ];

    render(<DistributionPreview amount={1000} recipients={recipients} />);

    // Check amounts: 50% of 1000 = 500.00, 30% = 300.00, 20% = 200.00
    expect(screen.getByTestId('payout-amount-0').textContent).toBe('$500.00');
    expect(screen.getByTestId('payout-amount-1').textContent).toBe('$300.00');
    expect(screen.getByTestId('payout-amount-2').textContent).toBe('$200.00');
  });

  it('handles small amounts with proper rounding', () => {
    const recipients = [
      { address: 'GBZX4TKKRMQNFTO2HKPXS4TH6HNCQB', share: 33 },
      { address: 'GCRW8J5TNPLQX2WDKFZ9M7B3CGHJKZ', share: 33 },
      { address: 'GAZX6N9KLPD4MWCFQYH5TBRJVGZKRM', share: 34 },
    ];

    render(<DistributionPreview amount={100} recipients={recipients} />);

    expect(screen.getByTestId('payout-amount-0').textContent).toBe('$33.00');
    expect(screen.getByTestId('payout-amount-1').textContent).toBe('$33.00');
    expect(screen.getByTestId('payout-amount-2').textContent).toBe('$34.00');
  });
});
