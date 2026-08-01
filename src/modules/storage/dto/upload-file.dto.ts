import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UploadFolder {
  ATTENDANCE = 'attendance',
  INCIDENTS = 'incidents',
  PATROLS = 'patrols',
}

export class UploadFileDto {
  @ApiProperty({ enum: UploadFolder, description: 'Target folder in B2' })
  @IsEnum(UploadFolder)
  folder!: UploadFolder;

  @ApiPropertyOptional({
    description: 'Optional reference ID for the client to track',
  })
  @IsOptional()
  @IsString()
  reference_id?: string;
}
