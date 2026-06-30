import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EndorsementForm from '../EndorsementForm';

describe('EndorsementForm', () => {
  it('renders the form correctly', () => {
    render(<EndorsementForm />);
    expect(screen.getByText('Endorse an Artist')).toBeInTheDocument();
    expect(screen.getByLabelText(/Artist Stellar Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Skill Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount \(XLM\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Endorsement/i })).toBeInTheDocument();
  });

  it('shows success message after successful submission', async () => {
    render(<EndorsementForm />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Artist Stellar Address/i), { target: { value: 'GBM...' } });
    fireEvent.change(screen.getByLabelText(/Skill Category/i), { target: { value: 'Mime' } });
    fireEvent.change(screen.getByLabelText(/Amount \(XLM\)/i), { target: { value: '10' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Send Endorsement/i }));
    
    // Wait for the simulated async call
    await waitFor(() => {
      expect(screen.getByText('Endorsement successful!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state during submission', async () => {
    render(<EndorsementForm />);
    
    fireEvent.change(screen.getByLabelText(/Artist Stellar Address/i), { target: { value: 'GBM...' } });
    fireEvent.change(screen.getByLabelText(/Skill Category/i), { target: { value: 'Mime' } });
    fireEvent.change(screen.getByLabelText(/Amount \(XLM\)/i), { target: { value: '10' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Send Endorsement/i }));
    
    // Button should be disabled during load
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
