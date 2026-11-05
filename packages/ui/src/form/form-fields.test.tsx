import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { z } from 'zod';

import { FormInput } from './form-input';
import { FormTextarea } from './form-textarea';
import { FormWrapper, useCustomForm } from './form-wrapper';
import { Input } from '../input';
import { Textarea } from '../textarea';

describe('shared UI field accessibility', () => {
  it('associates label, field and helper text without a caller id', () => {
    render(
      <>
        <Input label="Name" required helperText="Your full name" />
        <Textarea label="Note" error="Note is required" />
      </>,
    );

    const name = screen.getByRole('textbox', { name: 'Name' });
    expect(name).toBeRequired();
    expect(name).toHaveAccessibleDescription('Your full name');

    const note = screen.getByRole('textbox', { name: 'Note' });
    expect(note).toHaveAccessibleDescription('Note is required');
    expect(note.id).not.toBe(name.id);
  });

  it('keeps the required asterisk out of the accessible name', () => {
    render(<Input label="Email" required />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired();
  });
});

const schema = z.object({
  address: z.object({ street: z.string().min(1, 'Street is required') }),
  note: z.string(),
});
type FormValues = z.infer<typeof schema>;

function AddressForm({
  onStreetChange,
  streetRef,
  onSubmit = () => undefined,
  disabled,
}: {
  onStreetChange?: () => void;
  streetRef?: React.Ref<HTMLInputElement>;
  onSubmit?: (data: FormValues) => void;
  disabled?: boolean;
}) {
  const form = useCustomForm<FormValues>({
    schema,
    defaultValues: { address: { street: '' }, note: '' },
    disabled,
  });

  return (
    <FormWrapper formInstance={form} onSubmit={onSubmit}>
      <FormInput
        name="address.street"
        label="Street"
        ref={streetRef}
        onChange={onStreetChange}
      />
      <FormTextarea name="note" label="Note" />
      <button type="submit">Save</button>
    </FormWrapper>
  );
}

describe('shared UI form adapters', () => {
  it('renders as a plain field outside a form provider', () => {
    render(<FormInput name="email" label="Email" error="Invalid email" />);

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Invalid email',
    );
  });

  it('shows the error of a nested field name', async () => {
    render(<AddressForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Street')).toHaveAccessibleDescription(
        'Street is required',
      ),
    );
  });

  it('runs the caller onChange and still updates the form value', async () => {
    const onStreetChange = vi.fn();
    const onSubmit = vi.fn();
    render(<AddressForm onStreetChange={onStreetChange} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Street'), {
      target: { value: 'Main Street 1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onStreetChange).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      { address: { street: 'Main Street 1' }, note: '' },
      expect.anything(),
    );
  });

  it('forwards the caller ref to the field element', () => {
    const streetRef = createRef<HTMLInputElement>();
    render(<AddressForm streetRef={streetRef} />);

    expect(streetRef.current).toBe(screen.getByLabelText('Street'));
  });

  it('passes other React Hook Form options through useCustomForm', () => {
    render(<AddressForm disabled />);

    expect(screen.getByLabelText('Street')).toBeDisabled();
    expect(screen.getByLabelText('Note')).toBeDisabled();
  });
});
