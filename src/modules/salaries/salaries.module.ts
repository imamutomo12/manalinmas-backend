import { Module } from '@nestjs/common';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';
import { SalaryAdjustmentsService } from './salaryAdjusments.service';

@Module({
  controllers: [SalariesController],
  providers: [SalariesService, SalaryAdjustmentsService],
})
export class SalariesModule {}
