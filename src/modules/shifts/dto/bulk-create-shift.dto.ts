import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateShiftDto } from './create-shift.dto';

export class BulkCreateShiftDto {
  @ApiProperty({
    type: [CreateShiftDto],
    description: 'Array of shifts for the month',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShiftDto)
  shifts!: CreateShiftDto[];
}
