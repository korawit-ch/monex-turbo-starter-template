'use client';

import {
  type ClientAuthorizationContext,
  type Permission,
} from '@repo/authorization';
import { createContext, useContext, type ReactNode } from 'react';

type AuthContextValue = {
  auth: ClientAuthorizationContext;
  hasPermission: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  auth,
  children,
}: {
  auth: ClientAuthorizationContext;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider
      value={{
        auth,
        hasPermission: (permission) => auth.permissions.includes(permission),
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
