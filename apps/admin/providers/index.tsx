import { type ReactNode } from 'react';
import { ServerProvider } from './server-provider';
import { ClientProvider } from './client-provider';

interface ProvidersProps {
  children: ReactNode;
}

export async function Providers({ children }: ProvidersProps) {
  return (
    <ServerProvider>
      <ClientProvider>{children}</ClientProvider>
    </ServerProvider>
  );
}
