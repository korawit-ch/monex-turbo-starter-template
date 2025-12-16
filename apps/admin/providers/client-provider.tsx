'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ClientContextValue {
  user: { id: string; name: string; role: string } | null;
  isAuthenticated: boolean;
  login: (user: { id: string; name: string; role: string }) => void;
  logout: () => void;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
}

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  // Mock user state
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>({
    id: '1',
    name: 'Admin User',
    role: 'admin',
  });

  const login = (userData: { id: string; name: string; role: string }) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <ClientContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

