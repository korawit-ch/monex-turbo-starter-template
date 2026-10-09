'use client';

import {
  can as evaluate,
  type AuthorizationContext,
  type AuthorizationOptions,
  type Permission,
} from '@repo/authorization';
import { createContext, useContext, type ReactNode } from 'react';

type AuthContextValue = {
  auth: AuthorizationContext;
  can: (permission: Permission, options?: AuthorizationOptions) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  auth,
  children,
}: {
  auth: AuthorizationContext;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider
      value={{
        auth,
        can: (permission, options) => evaluate(auth, permission, options),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
