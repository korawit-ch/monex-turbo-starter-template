import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import type { LinkResponse } from '@repo/api-contract';

import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { toLinkResponse } from './links.mapper';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  async create(@Body() data: CreateLinkDto): Promise<LinkResponse> {
    const link = await this.linksService.create(data);
    return toLinkResponse(link);
  }

  @Get()
  async findAll(): Promise<LinkResponse[]> {
    const links = await this.linksService.findAll();
    return links.map(toLinkResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LinkResponse> {
    const link = await this.linksService.findOne(+id);
    return toLinkResponse(link);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateLinkDto,
  ): Promise<LinkResponse> {
    const link = await this.linksService.update(+id, data);
    return toLinkResponse(link);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<LinkResponse> {
    const link = await this.linksService.remove(+id);
    return toLinkResponse(link);
  }
}
