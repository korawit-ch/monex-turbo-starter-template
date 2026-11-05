import type { AuthorizationContext } from '@repo/authorization';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { AuthenticationError, getAuth } from '../../lib/auth/server';
import { useAuth } from '../../providers/auth-provider';
import ProtectedLayout from './layout';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  // Like Next, stop rendering by throwing.
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));
vi.mock('../../lib/auth/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/auth/server')>()),
  getAuth: vi.fn(),
}));

const getAuthMock = vi.mocked(getAuth);
const redirectMock = vi.mocked(redirect);

const condition = {
  operator: 'equals',
  subjectField: 'tenantId',
  resourceField: 'tenantId',
} as const;
const serverAuth: AuthorizationContext = {
  subject: { userId: 'user-1', tenantId: 'tenant-secret' },
  grants: [
    { permission: 'link.read', conditions: [condition] },
    { permission: 'link.create', conditions: [condition] },
  ],
};

function ClientContextProbe() {
  const { auth, hasPermission } = useAuth();
  return (
    <>
      <pre data-testid="client-auth">{JSON.stringify(auth)}</pre>
      <p>{hasPermission('link.create') ? 'may create' : 'may not create'}</p>
    </>
  );
}

beforeEach(() => {
  getAuthMock.mockReset();
  redirectMock.mockClear();
});

describe('ProtectedLayout', () => {
  it('renders children with only the user id and permission names', async () => {
    getAuthMock.mockResolvedValueOnce(serverAuth);

    render(await ProtectedLayout({ children: <ClientContextProbe /> }));

    expect(
      JSON.parse(screen.getByTestId('client-auth').textContent ?? ''),
    ).toEqual({ userId: 'user-1', permissions: ['link.read', 'link.create'] });
    expect(screen.getByTestId('client-auth')).not.toHaveTextContent(
      'tenant-secret',
    );
    expect(screen.getByText('may create')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects to session renewal when authentication fails', async () => {
    getAuthMock.mockRejectedValueOnce(
      new AuthenticationError('Access token is invalid or expired'),
    );

    await expect(
      ProtectedLayout({ children: <ClientContextProbe /> }),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith('/api/auth/refresh?returnTo=/');
  });

  it('rethrows configuration failures instead of redirecting', async () => {
    getAuthMock.mockRejectedValueOnce(
      new Error('AUTH_JWT_SECRET must contain at least 32 bytes'),
    );

    await expect(
      ProtectedLayout({ children: <ClientContextProbe /> }),
    ).rejects.toThrow('AUTH_JWT_SECRET must contain at least 32 bytes');
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
