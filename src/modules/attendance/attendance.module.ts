import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { GeofenceController } from './geofence.controller';
import { AttendanceService } from './attendance.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  controllers: [AttendanceController, GeofenceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
