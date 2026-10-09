import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateLinkRequest, UpdateLinkRequest } from '@repo/api-contract';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLinkRequest) {
    return this.prisma.client.link.create({
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
      },
    });
  }

  async findAll() {
    return this.prisma.client.link.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const link = await this.prisma.client.link.findUnique({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID ${id} not found`);
    }

    return link;
  }

  async update(id: number, data: UpdateLinkRequest) {
    await this.findOne(id); // Check if link exists

    return this.prisma.client.link.update({
      where: { id },
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if link exists

    return this.prisma.client.link.delete({
      where: { id },
    });
  }
}
