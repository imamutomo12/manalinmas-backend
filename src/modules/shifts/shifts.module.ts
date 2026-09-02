import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { ScheduleGeneratorService } from './schedule-generator.service';

@Module({
  controllers: [ShiftsController],
  providers: [ShiftsService, ScheduleGeneratorService],
})
export class ShiftsModule {}
