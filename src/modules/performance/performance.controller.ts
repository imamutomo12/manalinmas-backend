import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
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

@ApiTags('Performance Evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('evaluations')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Performance Evaluations of All Linmas (Koordinator)',
  })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getAllEvaluations(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const data = await this.performanceService.getMonthlyEvaluation(
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return { success: true, message: 'Performance evaluations loaded', data };
  }

  @Get('my-evaluation')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get My Performance Evaluation (Linmas)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getMyEvaluation(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    // Dengan melemparkan user.id, service hanya akan menghitung data Linmas tersebut
    const data = await this.performanceService.getMonthlyEvaluation(
      parseInt(month, 10),
      parseInt(year, 10),
      user.id,
    );
    return { success: true, message: 'My performance evaluation loaded', data };
  }
}
