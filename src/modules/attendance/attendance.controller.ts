import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
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
} from '@nestjs/swagger';
import { HandlePermissionDto } from './dto/permission.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('status')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get Today Attendance Status (Android Home)' })
  async getStatus(@CurrentUser() user: any) {
    const data = await this.attendanceService.getTodayAttendanceStatus(user.id);
    return { success: true, message: 'Status retrieved', data };
  }

  @Get('geofence')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get Master Geofence Configuration' })
  async getGeofence() {
    const data = this.attendanceService.getGeofenceConfig();
    return { success: true, message: 'Geofence config retrieved', data };
  }

  @Post('clock-in')
  @Roles(Role.LINMAS)
  @ApiConsumes('multipart/form-data') // Wajib untuk menerima file
  @ApiOperation({ summary: 'Clock-In Attendance with Photo Upload' })
  @UseInterceptors(FileInterceptor('photo')) // Menangkap form-data dengan key 'photo'
  async clockIn(
    @CurrentUser() user: any,
    @Body() dto: ClockInDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // Maksimal 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }), // Hanya menerima gambar
        ],
      }),
    )
    photo: Express.Multer.File, // File fisik didapat di sini
  ) {
    const data = await this.attendanceService.clockIn(user.id, dto, photo);
    return { success: true, message: 'Clock-in success', data };
  }

  @Post('clock-out')
  @Roles(Role.LINMAS)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Clock-Out Attendance with Photo Upload' })
  @UseInterceptors(FileInterceptor('photo'))
  async clockOut(
    @CurrentUser() user: any,
    @Body() dto: ClockOutDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ) {
    const data = await this.attendanceService.clockOut(user.id, dto, photo);
    return { success: true, message: 'Clock-out success', data };
  }

  @Get('recap')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Get Monthly Attendance Recap' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async getRecap(@Query('month') month: string, @Query('year') year: string) {
    const data = await this.attendanceService.getRecap(
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return { success: true, message: 'Attendance recap loaded', data };
  }

  @Get('today')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Today Attendance Roster (Koordinator Dashboard)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'YYYY-MM-DD, defaults to today',
  })
  @ApiQuery({ name: 'shift_type', required: false, enum: ShiftType })
  async getTodayAttendance(
    @Query('date') date?: string,
    @Query('shift_type') shiftType?: ShiftType,
  ) {
    const data = await this.attendanceService.getTodayAttendanceData(
      date,
      shiftType,
    );
    return { success: true, message: 'Today attendance loaded', data };
  }

  @Get('detail/:sessionId')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Attendance Session Detail (with photo evidence)',
  })
  async getAttendanceDetail(@Param('sessionId') sessionId: string) {
    const data = await this.attendanceService.getAttendanceDetail(sessionId);
    return { success: true, message: 'Attendance detail loaded', data };
  }

  @Post('permission')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'endpoint buat kirim izin presensi' })
  async handlePermission(
    @CurrentUser() user: any,
    @Body() dto: HandlePermissionDto,
  ) {
    const koordinatorId = user?.id || user?.sub;

    const result = await this.attendanceService.handleCoordinatorPermission(
      koordinatorId,
      dto,
    );

    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  }
}
