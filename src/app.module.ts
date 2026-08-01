import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HomeModule } from './modules/home/home.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { UsersModule } from './modules/users/users.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StorageModule } from './modules/storage/storage.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ViolationsModule } from './modules/violations/violations.module';
import { SalariesModule } from './modules/salaries/salaries.module';
import { PatrolsModule } from './modules/patrols/patrols.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ReguModule } from './modules/regu/regu.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PerformanceModule } from './modules/performance/performance.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    CommonModule,
    AuthModule,
    HomeModule,
    ShiftsModule,
    UsersModule,
    AttendanceModule,
    StorageModule,
    IncidentsModule,
    NotificationsModule,
    ViolationsModule,
    SalariesModule,
    PatrolsModule,
    ReguModule,
    ProfileModule,
    PerformanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the logger middleware to ALL routes
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
