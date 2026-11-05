import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider, useAuth } from './auth-provider';

const auth = {
  userId: 'user-1',
  permissions: ['link.read', 'link.create'] as const,
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider auth={{ ...auth, permissions: [...auth.permissions] }}>
      {children}
    </AuthProvider>
  );
}

describe('AuthProvider', () => {
  it('exposes the client context it was given', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.auth).toEqual({
      userId: 'user-1',
      permissions: ['link.read', 'link.create'],
    });
  });

  it('answers hasPermission from the given permission names only', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('link.read')).toBe(true);
    expect(result.current.hasPermission('link.create')).toBe(true);
    expect(result.current.hasPermission('link.update')).toBe(false);
    expect(result.current.hasPermission('link.delete')).toBe(false);
  });

  it('renders its children', () => {
    render(<p>child content</p>, { wrapper });

    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});

describe('useAuth', () => {
  it('throws outside AuthProvider', () => {
    // React logs the render error before rethrowing it.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider',
    );
  });
});
