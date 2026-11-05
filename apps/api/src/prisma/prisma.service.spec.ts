import { describe, it, expect, vi } from 'vitest';

const client = vi.hoisted(() => ({
  $connect: vi.fn<() => Promise<void>>(),
  $disconnect: vi.fn<() => Promise<void>>(),
}));

vi.mock('@repo/prisma', () => ({ default: client }));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('exposes the shared runtime client', () => {
    expect(new PrismaService().client).toBe(client);
  });

  it('connects on module init', async () => {
    client.$connect.mockResolvedValue();
    await new PrismaService().onModuleInit();
    expect(client.$connect).toHaveBeenCalledTimes(1);
    expect(client.$disconnect).not.toHaveBeenCalled();
  });

  it('fails startup when the connection fails', async () => {
    client.$connect.mockRejectedValue(new Error('connection refused'));
    await expect(new PrismaService().onModuleInit()).rejects.toThrow(
      'connection refused',
    );
  });

  it('disconnects on module destroy', async () => {
    client.$disconnect.mockResolvedValue();
    await new PrismaService().onModuleDestroy();
    expect(client.$disconnect).toHaveBeenCalledTimes(1);
    expect(client.$connect).not.toHaveBeenCalled();
  });
});
