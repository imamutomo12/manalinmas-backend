import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterLinmasDto {
  @ApiProperty({ example: 'Andi Wijaya' })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  phone_number!: string;

  @ApiProperty({ example: 'andi@linmas.id' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Blok A2' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  employment_date!: string;

  @ApiProperty({ example: 'uuid-of-regu' })
  @IsUUID('4')
  regu_id!: string;
}
