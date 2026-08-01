import { Controller, Get, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Geofence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('geofence')
export class GeofenceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('config')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get Geofence Configuration for Android Client' })
  getConfig() {
    const data = this.attendanceService.getGeofenceConfig();
    return { success: true, message: 'Geofence config loaded', data };
  }
}
