import { ApiProperty } from '@nestjs/swagger';
import type { CreateLinkRequest } from '@repo/api-contract';

/** Runtime DTO for Swagger; its shape is governed by the shared contract. */
export class CreateLinkDto implements CreateLinkRequest {
  @ApiProperty({ example: 'https://google.com' })
  url: string;

  @ApiProperty({ example: 'Google' })
  title: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
