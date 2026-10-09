import { type ReactNode } from 'react';
import { QueryProvider } from '../lib/query';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
