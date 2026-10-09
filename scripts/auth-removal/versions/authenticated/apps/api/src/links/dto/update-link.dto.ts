import { ApiProperty } from '@nestjs/swagger';
import type { UpdateLinkRequest } from '@repo/api-contract';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/** Runtime DTO for Swagger; its shape is governed by the shared contract. */
export class UpdateLinkDto implements UpdateLinkRequest {
  @ApiProperty({ example: 'https://google.com', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url?: string;

  @ApiProperty({ example: 'Google', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ example: 'Search engine', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
