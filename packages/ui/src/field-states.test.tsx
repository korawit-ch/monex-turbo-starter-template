import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';

import { Input } from './input';
import { Textarea } from './textarea';

const fields = [
  ['Input', Input],
  ['Textarea', Textarea],
] as const;

describe.each(fields)('%s states', (_name, Field) => {
  it('marks the field invalid and announces the error', () => {
    render(<Field id="note" label="Note" error="Note is required" />);

    const field = screen.getByRole('textbox', { name: 'Note' });
    const alert = screen.getByRole('alert');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toBeInvalid();
    expect(alert).toHaveTextContent('Note is required');
    expect(alert).toHaveAttribute('id', 'note-helper');
    expect(field).toHaveAttribute('aria-describedby', 'note-helper');
  });

  it('shows the error instead of the helper text', () => {
    render(
      <Field label="Note" helperText="Optional" error="Note is required" />,
    );

    expect(
      screen.getByRole('textbox', { name: 'Note' }),
    ).toHaveAccessibleDescription('Note is required');
    expect(screen.queryByText('Optional')).not.toBeInTheDocument();
  });

  it('shows helper text as a description without an alert when valid', () => {
    render(<Field label="Note" helperText="Shown on the card" />);

    const field = screen.getByRole('textbox', { name: 'Note' });
    expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(field).toBeValid();
    expect(field).toHaveAccessibleDescription('Shown on the card');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has no description without helper text or error', () => {
    render(<Field label="Note" />);

    const field = screen.getByRole('textbox', { name: 'Note' });
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).toHaveAttribute('aria-invalid', 'false');
  });

  it('disables the field', () => {
    render(<Field label="Note" disabled defaultValue="Kept" />);

    const field = screen.getByRole('textbox', { name: 'Note' });
    expect(field).toBeDisabled();
    expect(field).toHaveValue('Kept');
  });

  it('applies className to the wrapper, not the field', () => {
    const { container } = render(<Field label="Note" className="mt-4" />);

    expect(container.firstElementChild).toHaveClass('mt-4');
    expect(screen.getByRole('textbox', { name: 'Note' })).not.toHaveClass(
      'mt-4',
    );
  });
});

describe('Input specifics', () => {
  it('replaces the end icon with the error icon while in error', () => {
    const { rerender } = render(
      <Input
        label="Email"
        endIcon={<span data-testid="end-icon" />}
        errorIcon={<span data-testid="error-icon" />}
      />,
    );

    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('error-icon')).not.toBeInTheDocument();

    rerender(
      <Input
        label="Email"
        error="Invalid email"
        endIcon={<span data-testid="end-icon" />}
        errorIcon={<span data-testid="error-icon" />}
      />,
    );

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
  });

  it('forwards the ref and native input props', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} label="Email" type="email" name="email" />);

    const field = screen.getByRole('textbox', { name: 'Email' });
    expect(ref.current).toBe(field);
    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('name', 'email');
  });
});

describe('Textarea specifics', () => {
  it('defaults to two rows and accepts a custom row count', () => {
    const { rerender } = render(<Textarea label="Note" />);
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveAttribute(
      'rows',
      '2',
    );

    rerender(<Textarea label="Note" rows={6} />);
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveAttribute(
      'rows',
      '6',
    );
  });

  it('forwards the ref to the textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} label="Note" />);

    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Note' }));
  });
});
