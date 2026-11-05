import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LinksService } from './links.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LinksService', () => {
  let service: LinksService;
  let prismaClient: {
    link: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prismaClient = {
      link: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
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
