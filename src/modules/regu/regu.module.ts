import { Module } from '@nestjs/common';
import { ReguController } from './regu.controller';
import { ReguService } from './regu.service';

@Module({
  controllers: [ReguController],
  providers: [ReguService],
})
export class ReguModule {}
