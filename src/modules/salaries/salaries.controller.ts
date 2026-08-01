import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApproveSalaryAdjustmentDto } from './dto/approve-salary-adjustment.dto';
import { SalaryAdjustmentsService } from './salaryAdjusments.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Salaries & Adjustments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salaries')
export class SalariesController {
  constructor(
    private readonly salariesService: SalariesService,
    private readonly salaryAdjustmentsService: SalaryAdjustmentsService,
  ) {}

  @Get('recap')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Salary Adjustments Recap for All Linmas (Koordinator Only)',
  })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getAllAdjustments(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const data = await this.salariesService.calculateAdjustmentRecap(
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return { success: true, message: 'Salary adjustments loaded', data };
  }

  @Get('my-recap')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get My Salary Adjustments (Linmas Only)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getMyAdjustments(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const data = await this.salariesService.calculateAdjustmentRecap(
      parseInt(month, 10),
      parseInt(year, 10),
      user.id,
    );
    return {
      success: true,
      message: 'Personal salary adjustments loaded',
      data,
    };
  }

  @Post('generate')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Generate and persist salary adjustments',
  })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async generate(@Query('month') month: string, @Query('year') year: string) {
    const data = await this.salaryAdjustmentsService.saveMonthlyAdjustmentRecap(
      parseInt(month, 10),
      parseInt(year, 10),
    );

    return {
      success: true,
      message: 'Salary adjustments generated',
      data,
    };
  }

  @Get('saved-recap')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get persisted salary adjustments',
  })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getSavedRecap(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const data =
      await this.salaryAdjustmentsService.getSavedMonthlyAdjustmentRecap(
        parseInt(month, 10),
        parseInt(year, 10),
      );

    return {
      success: true,
      message: 'Salary adjustments loaded',
      data,
    };
  }

  @Patch(':periodId/approval')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Approve or revoke salary adjustment',
  })
  async approveSalary(
    @Param('periodId') periodId: string,
    @CurrentUser() user: any,
    @Body() dto: ApproveSalaryAdjustmentDto,
  ) {
    const data = await this.salaryAdjustmentsService.setApproval(
      periodId,
      dto.approved,
      user.id,
    );

    return {
      success: true,
      message: dto.approved ? 'Salary approved' : 'Salary approval revoked',
      data,
    };
  }
}
