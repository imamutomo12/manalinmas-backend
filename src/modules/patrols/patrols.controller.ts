import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatrolsService } from './patrols.service';
import { VisitCheckpointDto } from './dto/visit-checkpoint.dto';
import { CreatePatrolReportDto } from './dto/create-patrol-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Patrols')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patrols')
export class PatrolsController {
  constructor(private readonly patrolsService: PatrolsService) {}

  // ===========================================================================
  // A. PATROLI RUTIN (CHECKPOINT)
  // ===========================================================================

  @Get('checkpoints')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get all active patrol checkpoints' })
  async getCheckpoints() {
    const data = await this.patrolsService.getCheckpoints();
    return { success: true, message: 'Checkpoints loaded', data };
  }

  @Post('visit')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Visit a checkpoint (Geofence Verified)' })
  async visitCheckpoint(
    @CurrentUser() user: any,
    @Body() dto: VisitCheckpointDto,
  ) {
    const data = await this.patrolsService.visitCheckpoint(user.id, dto);
    return { success: true, message: 'Checkpoint visited successfully', data };
  }

  @Get('history')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get visited checkpoints for current active shift' })
  async getVisitHistory(@CurrentUser() user: any) {
    const data = await this.patrolsService.getVisitHistory(user.id);
    return { success: true, message: 'Visit history loaded', data };
  }

  @Get('summary')
  @Roles(Role.LINMAS, Role.KOORDINATOR)
  @ApiOperation({ summary: 'Get patrol progress summary for current shift' })
  async getPatrolSummary(@CurrentUser() user: any) {
    const data = await this.patrolsService.getPatrolSummary(user.id);
    return { success: true, message: 'Patrol summary loaded', data };
  }

  // ===========================================================================
  // B. LAPORAN TEMUAN (REPORT)
  // ===========================================================================

  @Post('report')
  @Roles(Role.LINMAS)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a Patrol Report Finding' })
  @UseInterceptors(FileInterceptor('photo'))
  async createPatrolReport(
    @CurrentUser() user: any,
    @Body() dto: CreatePatrolReportDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ) {
    const data = await this.patrolsService.createPatrolReport(
      user.id,
      dto,
      photo,
    );
    return {
      success: true,
      message: 'Patrol report submitted successfully',
      data,
    };
  }

  @Get('report')
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get List of Patrol Reports' })
  async getPatrolReports() {
    const data = await this.patrolsService.getPatrolReports();
    return { success: true, message: 'Patrol report list loaded', data };
  }

  @Get('report/:patrol_id')
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get Patrol Report Detail' })
  async getPatrolReportDetail(@Param('patrol_id') patrolId: string) {
    const data = await this.patrolsService.getPatrolReportDetail(patrolId);
    return { success: true, message: 'Patrol detail loaded', data };
  }
}
