import { IsBoolean } from 'class-validator';

export class ApproveSalaryAdjustmentDto {
  @IsBoolean()
  approved!: boolean;
}
