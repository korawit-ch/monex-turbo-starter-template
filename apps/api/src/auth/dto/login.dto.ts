import { ApiProperty } from '@nestjs/swagger';
import type { LoginRequest } from '@repo/api-contract';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: 'local-change-me' })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password: string;
}
