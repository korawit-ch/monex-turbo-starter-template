import { render, screen } from '@testing-library/react';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';

describe('shared UI icon slots', () => {
  it('renders caller-provided button icons independently of the variant', () => {
    render(
      <Button
        variant="secondary"
        startIcon={<span data-testid="start-icon" />}
        endIcon={<span data-testid="end-icon" />}
      >
        Continue
      </Button>,
    );

    expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('supports link behavior independently of visual variant', () => {
    render(
      <Button variant="primary" href="/next">
        Next
      </Button>,
    );

    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/next',
    );
  });

  it('renders a caller-provided input error icon without requiring one', () => {
    const { rerender } = render(
      <Input
        id="email"
        label="Email"
        error="Invalid email"
        errorIcon={<span data-testid="error-icon" />}
      />,
    );

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');

    rerender(<Input id="email" label="Email" error="Still invalid" />);

    expect(screen.queryByTestId('error-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Still invalid');
  });
});
