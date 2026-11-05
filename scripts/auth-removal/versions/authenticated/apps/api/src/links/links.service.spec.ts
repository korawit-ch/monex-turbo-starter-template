import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LinksService', () => {
  let service: LinksService;
  let prismaClient: {
    link: Record<string, Mock>;
  };

  beforeEach(async () => {
    prismaClient = {
      link: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: PrismaService,
          useValue: {
            client: prismaClient,
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
  });

  const tenantCondition = {
    operator: 'equals' as const,
    subjectField: 'tenantId' as const,
    resourceField: 'tenantId' as const,
  };

  function auth(
    ...permissions: Array<'link.read' | 'link.update' | 'link.delete'>
  ) {
    return {
      subject: { userId: 'u', tenantId: 'tenant-1' },
      grants: permissions.map((permission) => ({
        permission,
        conditions: [tenantCondition],
      })),
    };
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('includes tenant scope in list and detail queries', async () => {
    prismaClient.link.findMany.mockResolvedValue([]);
    prismaClient.link.findFirst.mockResolvedValue({ id: 1 });
    await service.findAll(auth('link.read'));
    await service.findOne(auth('link.read'), 1);
    expect(prismaClient.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1' } }),
    );
    expect(prismaClient.link.findFirst).toHaveBeenCalledWith({
      where: { id: 1, tenantId: 'tenant-1' },
    });
  });

  it('repeats tenant scope in final mutations', async () => {
    const link = { id: 1 };
    prismaClient.link.findFirst.mockResolvedValue(link);
    prismaClient.link.updateMany.mockResolvedValue({ count: 1 });
    prismaClient.link.deleteMany.mockResolvedValue({ count: 1 });
    const context = auth('link.update', 'link.delete');
    await service.update(context, 1, { title: 'Updated' });
    await service.remove(context, 1);
    expect(prismaClient.link.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, tenantId: 'tenant-1' } }),
    );
    expect(prismaClient.link.deleteMany).toHaveBeenCalledWith({
      where: { id: 1, tenantId: 'tenant-1' },
    });
  });

  it('fails closed when invoked without the required action grant', async () => {
    await expect(service.findAll(auth())).rejects.toThrow(ForbiddenException);
    expect(prismaClient.link.findMany).not.toHaveBeenCalled();
  });
});

describe('LinksService authorization, not-found and conflict paths', () => {
  type LinkRow = { id: number; tenantId: string; title: string; url: string };
  type Where = { where: Record<string, unknown> };

  const tenantCondition = {
    operator: 'equals' as const,
    subjectField: 'tenantId' as const,
    resourceField: 'tenantId' as const,
  };

  function auth(
    ...permissions: Array<
      'link.read' | 'link.create' | 'link.update' | 'link.delete'
    >
  ) {
    return {
      subject: { userId: 'u', tenantId: 'tenant-1' },
      grants: permissions.map((permission) => ({
        permission,
        conditions: [tenantCondition],
      })),
    };
  }

  const row: LinkRow = {
    id: 1,
    tenantId: 'tenant-1',
    title: 'Example',
    url: 'https://example.com',
  };

  function setup() {
    const link = {
      create: vi.fn<
        (args: { data: Record<string, unknown> }) => Promise<LinkRow>
      >(async () => row),
      findMany: vi.fn<(args: Where) => Promise<LinkRow[]>>(async () => []),
      findFirst: vi.fn<(args: Where) => Promise<LinkRow | null>>(
        async () => row,
      ),
      updateMany: vi.fn<
        (args: Where & { data: Record<string, unknown> }) => Promise<{
          count: number;
        }>
      >(async () => ({ count: 1 })),
      deleteMany: vi.fn<(args: Where) => Promise<{ count: number }>>(
        async () => ({ count: 1 }),
      ),
    };
    const service = new LinksService({ client: { link } } as never);
    const prismaCalls = () =>
      Object.values(link).reduce(
        (sum, mock) => sum + mock.mock.calls.length,
        0,
      );
    return { service, link, prismaCalls };
  }

  describe('create', () => {
    it('forbids an actor without link.create before any Prisma call', async () => {
      const { service, prismaCalls } = setup();
      await expect(
        service.create(auth('link.read', 'link.update', 'link.delete'), {
          title: 'T',
          url: 'https://example.com',
        }),
      ).rejects.toThrow(
        new ForbiddenException('Missing resource scope: link.create'),
      );
      expect(prismaCalls()).toBe(0);
    });

    it('writes the tenant resolved from the grant, never one from the body', async () => {
      const { service, link } = setup();
      const body = {
        title: 'T',
        url: 'https://example.com',
        description: 'D',
        tenantId: 'tenant-2',
      };
      await expect(service.create(auth('link.create'), body)).resolves.toBe(
        row,
      );
      expect(link.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          title: 'T',
          url: 'https://example.com',
          description: 'D',
        },
      });
    });

    it('fails closed when the grant carries no tenant condition', async () => {
      const { service, prismaCalls } = setup();
      const unscoped = {
        subject: { userId: 'u', tenantId: 'tenant-1' },
        grants: [{ permission: 'link.create' as const, conditions: [] }],
      };
      await expect(
        service.create(unscoped, { title: 'T', url: 'https://example.com' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prismaCalls()).toBe(0);
    });
  });

  describe('findOne', () => {
    it('throws 404 when no link matches inside the tenant', async () => {
      const { service, link } = setup();
      link.findFirst.mockResolvedValue(null);
      await expect(service.findOne(auth('link.read'), 99)).rejects.toThrow(
        new NotFoundException('Link with ID 99 not found'),
      );
      expect(link.findFirst).toHaveBeenCalledWith({
        where: { id: 99, tenantId: 'tenant-1' },
      });
    });
  });

  describe('update', () => {
    it('forbids an actor holding only link.read before any Prisma call', async () => {
      const { service, prismaCalls } = setup();
      await expect(
        service.update(auth('link.read'), 1, { title: 'New' }),
      ).rejects.toThrow(
        new ForbiddenException('Missing resource scope: link.update'),
      );
      expect(prismaCalls()).toBe(0);
    });

    it('throws 404 and does not write when the link is outside the tenant or missing', async () => {
      const { service, link } = setup();
      link.findFirst.mockResolvedValue(null);
      await expect(
        service.update(auth('link.update'), 1, { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
      expect(link.findFirst).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 'tenant-1' },
      });
      expect(link.updateMany).not.toHaveBeenCalled();
    });

    it('writes only contract fields and returns the re-read row', async () => {
      const { service, link } = setup();
      const updated = { ...row, title: 'New' };
      link.findFirst.mockResolvedValueOnce(row).mockResolvedValueOnce(updated);
      const body = { title: 'New', tenantId: 'tenant-2' };
      await expect(service.update(auth('link.update'), 1, body)).resolves.toBe(
        updated,
      );
      expect(link.updateMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 'tenant-1' },
        data: { title: 'New', url: undefined, description: undefined },
      });
      expect(link.findFirst).toHaveBeenCalledTimes(2);
    });

    it('returns 409 when the row disappears between the check and the write', async () => {
      const { service, link } = setup();
      link.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.update(auth('link.update'), 1, { title: 'New' }),
      ).rejects.toThrow(
        new ConflictException(
          'The link changed before the operation completed',
        ),
      );
      expect(link.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('forbids an actor holding only link.read before any Prisma call', async () => {
      const { service, prismaCalls } = setup();
      await expect(service.remove(auth('link.read'), 1)).rejects.toThrow(
        new ForbiddenException('Missing resource scope: link.delete'),
      );
      expect(prismaCalls()).toBe(0);
    });

    it('throws 404 and does not delete when the link is outside the tenant or missing', async () => {
      const { service, link } = setup();
      link.findFirst.mockResolvedValue(null);
      await expect(service.remove(auth('link.delete'), 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(link.deleteMany).not.toHaveBeenCalled();
    });

    it('returns the row read before deletion', async () => {
      const { service, link } = setup();
      await expect(service.remove(auth('link.delete'), 1)).resolves.toBe(row);
      expect(link.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 'tenant-1' },
      });
    });

    it('returns 409 when the row disappears between the check and the delete', async () => {
      const { service, link } = setup();
      link.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove(auth('link.delete'), 1)).rejects.toThrow(
        new ConflictException(
          'The link changed before the operation completed',
        ),
      );
    });
  });

  it.todo(
    'maps a duplicate tenant URL (Prisma P2002) on create/update to 409; today it surfaces as 500',
  );
});
