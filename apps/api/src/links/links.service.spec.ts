import { Test, TestingModule } from '@nestjs/testing';
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('includes tenant scope in list and detail queries', async () => {
    prismaClient.link.findMany.mockResolvedValue([]);
    prismaClient.link.findFirst.mockResolvedValue({ id: 1 });
    const auth = {
      userId: 'u',
      tenantId: 'tenant-1',
      permissions: ['link.read'],
    } as const;
    await service.findAll(auth as never);
    await service.findOne(auth as never, 1);
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
    const auth = {
      userId: 'u',
      tenantId: 'tenant-1',
      permissions: [],
    } as const;
    await service.update(auth as never, 1, { title: 'Updated' });
    await service.remove(auth as never, 1);
    expect(prismaClient.link.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, tenantId: 'tenant-1' } }),
    );
    expect(prismaClient.link.deleteMany).toHaveBeenCalledWith({
      where: { id: 1, tenantId: 'tenant-1' },
    });
  });
});
