import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { LogoutButton } from './logout-button';

function stubLocation() {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
  return assign;
}

describe('LogoutButton', () => {
  it('posts to the logout BFF route, then navigates to /login', async () => {
    const assign = stubLocation();
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{"ok":true}')));
    vi.stubGlobal('fetch', fetchMock);
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });
  });

  it('navigates only after the logout request has finished', async () => {
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
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await Promise.resolve();
    expect(assign).not.toHaveBeenCalled();

    finish(new Response('{"ok":true}'));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'));
  });
});
