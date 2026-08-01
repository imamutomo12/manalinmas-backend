import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    enum: Role,
    description: 'Filter users by role (e.g., LINMAS)',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
