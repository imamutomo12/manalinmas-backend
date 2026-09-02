import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { SubstituteShiftDto } from './dto/substitute-shift.dto';
import { BulkCreateShiftDto } from './dto/bulk-create-shift.dto';
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
import { GenerateScheduleDto } from './dto/generate-schedule.dto';

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Create Shift Schedule (Koordinator Only)' })
  async createShift(@Body() dto: CreateShiftDto) {
    const data = await this.shiftsService.createShift(dto);
    return { success: true, message: 'Shift created', data };
  }

  @Post('bulk')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Bulk Create Shift Schedule (Koordinator Only)' })
  async createBulkShifts(@Body() dto: BulkCreateShiftDto) {
    const data = await this.shiftsService.createBulkShifts(dto);
    return { success: true, message: 'Bulk shifts created successfully', data };
  }

  @Get()
  @Roles(Role.KOORDINATOR) // HANYA KOORDINATOR
  @ApiOperation({ summary: 'Get All Shift List (Koordinator Only)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getShifts(@Query('month') month: string, @Query('year') year: string) {
    const data = await this.shiftsService.getShifts(
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return { success: true, message: 'Shift list loaded', data };
  }

  // ENDPOINT BARU: Jadwal Khusus Linmas
  @Get('my')
  @Roles(Role.LINMAS) // HANYA LINMAS
  @ApiOperation({ summary: 'Get My Personal Shift Schedule (Linmas Only)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getMyShifts(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const data = await this.shiftsService.getMyShifts(
      user.id,
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return { success: true, message: 'My shifts loaded', data };
  }

  @Put(':shift_id')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Update Shift Schedule (Koordinator Only)' })
  async updateShift(
    @Param('shift_id') shiftId: string,
    @Body() dto: UpdateShiftDto,
  ) {
    await this.shiftsService.updateShift(shiftId, dto);
    return { success: true, message: 'Shift updated' };
  }

  @Delete(':shift_id')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Delete Shift Schedule (Koordinator Only)' })
  async deleteShift(@Param('shift_id') shiftId: string) {
    await this.shiftsService.deleteShift(shiftId);
    return { success: true, message: 'Shift deleted' };
  }

  @Post(':shift_id/substitute')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Assign Substitute Officer (Koordinator Only)' })
  async assignSubstitute(
    @Param('shift_id') shiftId: string,
    @Body() dto: SubstituteShiftDto,
  ) {
    const data = await this.shiftsService.assignSubstitute(shiftId, dto);
    return { success: true, message: 'Substitute assigned', data };
  }

  // =========================================================================
  // PREVIEW GENERATE JADWAL
  // =========================================================================
  @Post('generate/preview')
  async previewGenerateSchedule(@Body() dto: GenerateScheduleDto) {
    return this.shiftsService.previewGenerateMonthlySchedule(
      dto.month,
      dto.year,
    );
  }

  // =========================================================================
  // GENERATE & SAVE JADWAL
  // =========================================================================
  @Post('generate')
  async generateSchedule(@Body() dto: GenerateScheduleDto) {
    return this.shiftsService.generateMonthlySchedule(dto.month, dto.year);
  }
}
