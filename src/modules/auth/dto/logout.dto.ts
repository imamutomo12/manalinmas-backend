import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({ example: 'firebase_device_token' })
  @IsString()
  @IsNotEmpty()
  fcm_token!: string;
}
