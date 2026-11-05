import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import LoginPage from './page';

function stubLocation() {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
  return assign;
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'admin@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'local-change-me' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginPage', () => {
  it('labels both fields and marks them required', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('posts the credentials to the login BFF route and navigates home', async () => {
    const assign = stubLocation();
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{"ok":true}')));
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginPage />);

    fillAndSubmit();

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'local-change-me',
      }),
    });
  });

  it('disables the button while signing in', async () => {
    const assign = stubLocation();
    let finish: (response: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    render(<LoginPage />);

    fillAndSubmit();

    const pending = await screen.findByRole('button', { name: 'Signing in…' });
    expect(pending).toBeDisabled();
    finish(new Response('{"ok":true}'));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'));
  });

  it.each([
    [401, 'Invalid credentials'],
    [403, 'Unable to sign in'],
    [500, 'Unable to sign in'],
  ])(
    'shows an alert for a %i and lets the user retry',
    async (status, message) => {
      const assign = stubLocation();
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response('{}', { status }))),
      );
      render(<LoginPage />);

      fillAndSubmit();

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
      expect(assign).not.toHaveBeenCalled();
    },
  );

  it('clears the previous error when submitting again', async () => {
    const assign = stubLocation();
    let finish: (response: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('{}', { status: 401 }))
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              finish = resolve;
            }),
        ),
    );
    render(<LoginPage />);

    fillAndSubmit();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
    finish(new Response('{"ok":true}'));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'));
  });

  it.todo(
    'recovers from a network failure (fetch rejects) — currently stays on "Signing in…"; see report',
  );
});
