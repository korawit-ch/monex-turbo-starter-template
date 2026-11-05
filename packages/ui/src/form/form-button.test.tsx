import { describe, it, expect, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { z } from 'zod';

import { FormButton } from './form-button';
import { FormInput } from './form-input';
import { FormWrapper, useCustomForm } from './form-wrapper';

const schema = z.object({ title: z.string().min(1, 'Title is required') });
type FormValues = z.infer<typeof schema>;

function TitleForm({
  onSubmit = () => undefined,
  defaultTitle = '',
  children,
}: {
  onSubmit?: (data: FormValues) => unknown;
  defaultTitle?: string;
  children: React.ReactNode;
}) {
  const form = useCustomForm<FormValues>({
    schema,
    defaultValues: { title: defaultTitle },
  });

  return (
    <FormWrapper formInstance={form} onSubmit={onSubmit}>
      <FormInput name="title" label="Title" />
      {children}
    </FormWrapper>
  );
}

describe('FormButton', () => {
  it('renders an enabled submit button outside a form provider', () => {
    render(<FormButton>Save</FormButton>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('is disabled while the form is invalid and enabled once it is valid', async () => {
    render(
      <TitleForm>
        <FormButton>Save</FormButton>
      </TitleForm>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(button).toBeDisabled());

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Docs' },
    });

    await waitFor(() => expect(button).toBeEnabled());
  });

  it('submits the form values when valid', async () => {
    const onSubmit = vi.fn();
    render(
      <TitleForm onSubmit={onSubmit} defaultTitle="Docs">
        <FormButton>Save</FormButton>
      </TitleForm>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Docs' }, expect.anything());
  });

  it('is disabled while the submit handler is pending', async () => {
    let finishSubmit: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSubmit = resolve;
        }),
    );
    render(
      <TitleForm onSubmit={onSubmit} defaultTitle="Docs">
        <FormButton>Save</FormButton>
      </TitleForm>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(button).toBeDisabled();

    await act(async () => {
      finishSubmit();
    });

    await waitFor(() => expect(button).toBeEnabled());
  });

  it('stays enabled while invalid when autoDisable is false', async () => {
    render(
      <TitleForm>
        <FormButton autoDisable={false}>Save anyway</FormButton>
        <FormButton>Save</FormButton>
      </TitleForm>,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    );
    expect(screen.getByRole('button', { name: 'Save anyway' })).toBeEnabled();
  });

  it('does not auto-disable non-submit buttons', async () => {
    render(
      <TitleForm>
        <FormButton type="button">Preview</FormButton>
        <FormButton type="reset">Reset</FormButton>
        <FormButton>Save</FormButton>
      </TitleForm>,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    );
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveAttribute(
      'type',
      'reset',
    );
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled();
  });

  it('honours an explicit disabled prop even when the form is valid', async () => {
    render(
      <TitleForm defaultTitle="Docs">
        <FormButton disabled>Save</FormButton>
        <FormButton>Other</FormButton>
      </TitleForm>,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Other' })).toBeEnabled(),
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('does not reset React Hook Form values: a reset button only triggers a native form reset', async () => {
    const onSubmit = vi.fn();
    render(
      <TitleForm onSubmit={onSubmit} defaultTitle="Docs">
        <FormButton type="reset">Reset</FormButton>
        <FormButton>Save</FormButton>
      </TitleForm>,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Changed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText('Title')).toHaveValue('Changed');

    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      { title: 'Changed' },
      expect.anything(),
    );
  });
});
