import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AuthProvider } from '../../providers/auth-provider';
import { AuthenticationError, getAuth } from '../../lib/auth/server';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    const auth = await getAuth();
    return <AuthProvider auth={auth}>{children}</AuthProvider>;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/api/auth/refresh?returnTo=/');
    }
    throw error;
  }
}
