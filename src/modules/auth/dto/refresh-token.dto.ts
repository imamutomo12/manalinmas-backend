import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'jwt_refresh_token' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
