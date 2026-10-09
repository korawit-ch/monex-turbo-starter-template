import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateLinkRequest, UpdateLinkRequest } from '@repo/api-contract';
import type { AuthorizationContext } from '@repo/authorization';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(auth: AuthorizationContext, data: CreateLinkRequest) {
    return this.prisma.client.link.create({
      data: {
        tenantId: auth.tenantId,
        title: data.title,
        url: data.url,
        description: data.description,
      },
    });
  }

  async findAll(auth: AuthorizationContext) {
    return this.prisma.client.link.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(auth: AuthorizationContext, id: number) {
    const link = await this.prisma.client.link.findFirst({
      where: { id, tenantId: auth.tenantId },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID ${id} not found`);
    }

    return link;
  }

  async update(
    auth: AuthorizationContext,
    id: number,
    data: UpdateLinkRequest,
  ) {
    await this.findOne(auth, id);
    const result = await this.prisma.client.link.updateMany({
      where: { id, tenantId: auth.tenantId },
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
      },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        'The link changed before the operation completed',
      );
    }
    return this.findOne(auth, id);
  }

  async remove(auth: AuthorizationContext, id: number) {
    const link = await this.findOne(auth, id);
    const result = await this.prisma.client.link.deleteMany({
      where: { id, tenantId: auth.tenantId },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        'The link changed before the operation completed',
      );
    }
    return link;
  }
}
