// src/modules/performance/performance.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, ShiftType } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Performance Evaluation & Adjustments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // ========================
  // MONTHLY PERFORMANCE (Existing)
  // ========================
  @Get('evaluations')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Monthly Performance Evaluations of All Linmas (Koordinator)',
  })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getAllMonthlyEvaluations(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      throw new BadRequestException('Invalid month or year format.');
    }

    const data = await this.performanceService.getMonthlyEvaluation(
      parsedMonth,
      parsedYear,
    );
    return {
      success: true,
      message: 'Monthly performance evaluations loaded',
      data,
    };
  }

  @Get('my-evaluation')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get My Monthly Performance Evaluation (Linmas)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getMyMonthlyEvaluation(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      throw new BadRequestException('Invalid month or year format.');
    }

    const data = await this.performanceService.getMonthlyEvaluation(
      parsedMonth,
      parsedYear,
      user.id,
    );
    return {
      success: true,
      message: 'My monthly performance evaluation loaded',
      data,
    };
  }

  // ========================
  // DAILY PERFORMANCE (New)
  // ========================
  // Inside the PerformanceController class

  @Get('daily')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Daily Performance Summary for All Officers (Koordinator)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'shift_type',
    required: false,
    type: String,
    description: 'MORNING or NIGHT',
  })
  async getDailyPerformance(
    @Query('date') date: string,
    @Query('shift_type') shiftTypeStr?: string, // Accept as string first
  ) {
    if (!this.isValidDate(date)) {
      throw new BadRequestException(
        'Invalid date format. Expected YYYY-MM-DD.',
      );
    }

    let shiftType: ShiftType | undefined = undefined;
    if (shiftTypeStr) {
      const upperCaseShiftType = shiftTypeStr.toUpperCase();
      if (Object.values(ShiftType).includes(upperCaseShiftType as ShiftType)) {
        shiftType = upperCaseShiftType as ShiftType; // Cast to ensure it's the correct enum value
      } else {
        throw new BadRequestException(
          'Invalid shift type. Use MORNING or NIGHT.',
        );
      }
    }

    const data = await this.performanceService.getDailyPerformance(
      date,
      shiftType, // Pass the correctly typed enum value
    );
    return {
      success: true,
      message: 'Daily performance summary loaded',
      data,
    };
  }

  @Get('daily/my-today')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get My Performance for Today (Linmas)' })
  async getMyDailyPerformance(@CurrentUser() user: any) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const data = await this.performanceService.getDailyPerformance(
      today,
      undefined,
      user.id,
    );
    return {
      success: true,
      message: 'My performance for today loaded',
      data,
    };
  }

  @Get('daily/detail/:shift_assignment_id')
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({
    summary: 'Get Detailed Performance for Specific Shift Assignment',
  })
  async getShiftAssignmentPerformance(
    @Param('shift_assignment_id') shiftAssignmentId: string,
    @CurrentUser() user: any,
  ) {
    // Optional: Add authorization check if LINMAS should only access their own
    const data =
      await this.performanceService.getShiftAssignmentPerformance(
        shiftAssignmentId,
      );
    return {
      success: true,
      message: 'Detailed shift assignment performance loaded',
      data,
    };
  }

  // NEW: Get Specific Monthly Performance Evaluation (e.g., for Coordinator to view specific Linmas)
  @Get('evaluations/:linmas_id') // Define the route path
  @Roles(Role.KOORDINATOR) // Adjust roles as necessary
  @ApiOperation({
    summary:
      'Get Monthly Performance Evaluation for a Specific Linmas (Koordinator)',
  })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Evaluation loaded successfully.' })
  @ApiResponse({ status: 404, description: 'Evaluation not found.' })
  @ApiResponse({ status: 400, description: 'Invalid month or year format.' })
  async getSpecificMonthlyEvaluation(
    @Param('linmas_id') linmasId: string, // Extract linmasId from the path
    @Query('month') month: string, // Extract month from query
    @Query('year') year: string, // Extract year from query
    @CurrentUser() user: any, // Optional: for authorization checks
  ) {
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      throw new BadRequestException('Invalid month or year format.');
    }

    // Call the service method to get the specific evaluation
    const data = await this.performanceService.getSpecificMonthlyEvaluation(
      linmasId,
      parsedMonth,
      parsedYear,
    );

    if (!data) {
      // Return a 404-like response if not found
      return {
        success: false,
        message: 'Evaluation not found for the specified Linmas and period.',
        data: null,
      };
    }

    // Return the found evaluation
    return {
      success: true,
      message: 'Specific monthly performance evaluation loaded',
      data: data, // This should be a single evaluation object
    };
  }

  // ========================
  // SALARY ADJUSTMENTS (New)
  // ========================
  @Get('adjustments/:linmas_id/:month/:year')
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get Monthly Salary Adjustment Record' })
  async getMonthlyAdjustment(
    @Param('linmas_id') linmasId: string,
    @Param('month') month: string,
    @Param('year') year: string,
    @CurrentUser() user: any,
  ) {
    // Authorization: Only allow LINMAS to fetch their own data
    if (user.role === Role.LINMAS && user.id !== linmasId) {
      throw new BadRequestException(
        'You can only view your own adjustment records.',
      );
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      throw new BadRequestException('Invalid month or year format.');
    }

    const data = await this.performanceService.getMonthlyAdjustment(
      linmasId,
      parsedMonth,
      parsedYear,
    );
    if (!data) {
      return {
        success: false,
        message: 'Adjustment record not found for the specified period.',
        data: null,
      };
    }
    return {
      success: true,
      message: 'Monthly adjustment record loaded',
      data,
    };
  }

  @Put('adjustments/:adjustment_period_id/approve')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Approve a Monthly Salary Adjustment Record (Koordinator)',
  })
  async approveMonthlyAdjustment(
    @Param('adjustment_period_id') adjustmentPeriodId: string,
    @CurrentUser() user: any, // Koordinator ID
  ) {
    const data = await this.performanceService.approveMonthlyAdjustment(
      adjustmentPeriodId,
      user.id,
    );
    return {
      success: true,
      message: 'Monthly adjustment record approved successfully',
      data,
    };
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
