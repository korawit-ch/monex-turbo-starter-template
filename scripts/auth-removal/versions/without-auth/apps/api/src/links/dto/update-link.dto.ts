import { ApiProperty } from '@nestjs/swagger';
import type { UpdateLinkRequest } from '@repo/api-contract';

/** Runtime DTO for Swagger; its shape is governed by the shared contract. */
export class UpdateLinkDto implements UpdateLinkRequest {
  @ApiProperty({ example: 'https://google.com', required: false })
  url?: string;

  @ApiProperty({ example: 'Google', required: false })
  title?: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
