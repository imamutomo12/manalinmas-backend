import { Module } from '@nestjs/common';
import { PatrolsController } from './patrols.controller';
import { PatrolsService } from './patrols.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  controllers: [PatrolsController],
  providers: [PatrolsService],
})
export class PatrolsModule {}
