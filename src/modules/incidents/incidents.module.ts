import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { MyIncidentsController } from './my-incidents.controller';
import { IncidentsService } from './incidents.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [StorageModule, NotificationsModule, PrismaModule], // <-- TAMBAHKAN DI SINI
  controllers: [IncidentsController, MyIncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
