import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateLinkRequest, UpdateLinkRequest } from '@repo/api-contract';
import {
  resourceScope,
  type AuthorizationContext,
  type Permission,
} from '@repo/authorization';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(auth: AuthorizationContext, permission: Permission) {
    const scope = resourceScope(auth, permission);
    if (!scope?.tenantId) {
      throw new ForbiddenException(`Missing resource scope: ${permission}`);
    }
    return { tenantId: scope.tenantId };
  }

  async create(auth: AuthorizationContext, data: CreateLinkRequest) {
    const scope = this.scope(auth, 'link.create');
    return this.prisma.client.link.create({
      data: {
        ...scope,
        title: data.title,
        url: data.url,
        description: data.description,
      },
    });
  }

  async findAll(auth: AuthorizationContext) {
    return this.prisma.client.link.findMany({
      where: this.scope(auth, 'link.read'),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(auth: AuthorizationContext, id: number) {
    return this.findOneForPermission(auth, id, 'link.read');
  }

  private async findOneForPermission(
    auth: AuthorizationContext,
    id: number,
    permission: Permission,
  ) {
    const link = await this.prisma.client.link.findFirst({
      where: { id, ...this.scope(auth, permission) },
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
    await this.findOneForPermission(auth, id, 'link.update');
    const scope = this.scope(auth, 'link.update');
    const result = await this.prisma.client.link.updateMany({
      where: { id, ...scope },
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
    return this.findOneForPermission(auth, id, 'link.update');
  }

  async remove(auth: AuthorizationContext, id: number) {
    const link = await this.findOneForPermission(auth, id, 'link.delete');
    const scope = this.scope(auth, 'link.delete');
    const result = await this.prisma.client.link.deleteMany({
      where: { id, ...scope },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        'The link changed before the operation completed',
      );
    }
    return link;
  }
}
