import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ViolationsService } from './violations.service';
import { CreateViolationDto } from './dto/create-violation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Violations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('violations')
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Issue a Violation / SP (Koordinator Only)' })
  async createViolation(
    @CurrentUser() user: any,
    @Body() dto: CreateViolationDto,
  ) {
    const data = await this.violationsService.createViolation(user.id, dto);
    return { success: true, message: 'Violation recorded successfully', data };
  }

  @Get()
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get Violation History' })
  @ApiQuery({ name: 'linmas_id', required: false, type: String })
  async getViolations(
    @CurrentUser() user: any,
    @Query('linmas_id') linmasId?: string,
  ) {
    // Linmas can only see their own violations
    const targetId = user.role === Role.LINMAS ? user.id : linmasId;
    const data = await this.violationsService.getViolations(targetId);
    return { success: true, message: 'Violations loaded', data };
  }
}
