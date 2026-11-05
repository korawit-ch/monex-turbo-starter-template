import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { PrismaClient, PrismaPg } = vi.hoisted(() => ({
  PrismaClient: vi.fn(function PrismaClient(this: object, options: unknown) {
    Object.assign(this, { options });
  }),
  PrismaPg: vi.fn(function PrismaPg(this: object, config: unknown) {
    Object.assign(this, { config });
  }),
}));

vi.mock('@prisma/client', () => ({ PrismaClient }));
vi.mock('@prisma/adapter-pg', () => ({ PrismaPg }));

const localDevelopmentUrl =
  'postgresql://postgres:postgres@localhost:5433/monex-turbo-starter-template-db?schema=public';

const globalCache = globalThis as { prismaGlobal?: unknown };

async function importClient() {
  vi.resetModules();
  const module = await import('./index');
  return module.default;
}

describe('@repo/prisma runtime client', () => {
  beforeEach(() => {
    PrismaClient.mockClear();
    PrismaPg.mockClear();
    delete globalCache.prismaGlobal;
  });

  afterEach(() => {
    delete globalCache.prismaGlobal;
  });

  it('refuses to start in production without DATABASE_URL', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', undefined);

    await expect(importClient()).rejects.toThrow(
      'DATABASE_URL is required in production.',
    );
    expect(PrismaPg).not.toHaveBeenCalled();
    expect(PrismaClient).not.toHaveBeenCalled();
  });

  it('treats an empty DATABASE_URL in production as missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', '');

    await expect(importClient()).rejects.toThrow(
      'DATABASE_URL is required in production.',
    );
    expect(PrismaPg).not.toHaveBeenCalled();
  });

  it('connects to DATABASE_URL in production, logs errors only and does not cache globally', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', 'postgresql://prod-host:5432/app');

    const client = await importClient();

    expect(PrismaPg).toHaveBeenCalledTimes(1);
    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://prod-host:5432/app',
    });
    expect(PrismaClient).toHaveBeenCalledTimes(1);
    expect(PrismaClient).toHaveBeenCalledWith({
      adapter: PrismaPg.mock.instances[0],
      log: ['error'],
    });
    expect(client).toBe(PrismaClient.mock.instances[0]);
    expect(globalCache.prismaGlobal).toBeUndefined();
  });

  it('falls back to the local database outside production and logs queries in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DATABASE_URL', undefined);

    const client = await importClient();

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: localDevelopmentUrl,
    });
    expect(PrismaClient).toHaveBeenCalledWith({
      adapter: PrismaPg.mock.instances[0],
      log: ['query', 'error', 'warn'],
    });
    expect(globalCache.prismaGlobal).toBe(client);
  });

  it('prefers DATABASE_URL over the local default outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5440/test-db');

    await importClient();

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://localhost:5440/test-db',
    });
    expect(PrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({ log: ['error'] }),
    );
  });

  it('reuses the cached client across reloads outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DATABASE_URL', undefined);

    const first = await importClient();
    const second = await importClient();

    expect(second).toBe(first);
    expect(PrismaPg).toHaveBeenCalledTimes(1);
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
