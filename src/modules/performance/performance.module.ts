import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { PerformanceCalculatorService } from './performance-calculator.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [PerformanceController],
  providers: [PerformanceService, PerformanceCalculatorService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
