import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import type { LinkResponse } from '@repo/api-contract';
import type { AuthorizationContext } from '@repo/authorization';

import { CurrentAuth, RequirePermission } from '../auth/auth.decorators';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { toLinkResponse } from './links.mapper';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @RequirePermission('link.create')
  async create(
    @CurrentAuth() auth: AuthorizationContext,
    @Body() data: CreateLinkDto,
  ): Promise<LinkResponse> {
    const link = await this.linksService.create(auth, data);
    return toLinkResponse(link);
  }

  @Get()
  @RequirePermission('link.read')
  async findAll(
    @CurrentAuth() auth: AuthorizationContext,
  ): Promise<LinkResponse[]> {
    const links = await this.linksService.findAll(auth);
    return links.map(toLinkResponse);
  }

  @Get(':id')
  @RequirePermission('link.read')
  async findOne(
    @CurrentAuth() auth: AuthorizationContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LinkResponse> {
    const link = await this.linksService.findOne(auth, id);
    return toLinkResponse(link);
  }

  @Patch(':id')
  @RequirePermission('link.update')
  async update(
    @CurrentAuth() auth: AuthorizationContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLinkDto,
  ): Promise<LinkResponse> {
    const link = await this.linksService.update(auth, id, data);
    return toLinkResponse(link);
  }

  @Delete(':id')
  @RequirePermission('link.delete')
  async remove(
    @CurrentAuth() auth: AuthorizationContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LinkResponse> {
    const link = await this.linksService.remove(auth, id);
    return toLinkResponse(link);
  }
}
