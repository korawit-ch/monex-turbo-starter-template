import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LinksController', () => {
  let controller: LinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        LinksService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              link: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    controller = module.get<LinksController>(LinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
