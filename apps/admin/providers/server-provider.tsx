import { type ReactNode } from 'react';

interface ServerConfig {
  apiUrl: string;
  environment: string;
  version: string;
}

// Server-side configuration - fetched/computed on server
async function getServerConfig(): Promise<ServerConfig> {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };
}

interface ServerProviderProps {
  children: ReactNode;
}

export async function ServerProvider({ children }: ServerProviderProps) {
  const config = await getServerConfig();

  return <div data-server-config={JSON.stringify(config)}>{children}</div>;
}
