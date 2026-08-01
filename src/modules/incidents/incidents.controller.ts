import {
  Controller,
  Post,
  Get,
  Patch,
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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { InterveneIncidentDto } from './dto/intervene-incident.dto';
import { CreateIncidentRatingDto } from './dto/create-incident-rating.dto';
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

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(Role.WARGA)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create Incident Report (Warga Only)' })
  @UseInterceptors(FileInterceptor('photo'))
  async createIncident(
    @CurrentUser() user: any,
    @Body() dto: CreateIncidentDto,
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
    const data = await this.incidentsService.createIncident(
      user.id,
      dto,
      photo,
    );
    return { success: true, message: 'Incident reported', data };
  }

  @Get()
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get All Incident List' })
  async getIncidents() {
    const data = await this.incidentsService.getIncidents();
    return { success: true, message: 'Incident list loaded', data };
  }

  @Get('active')
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get Active Incidents Only' })
  async getActiveIncidents() {
    const data = await this.incidentsService.getActiveIncidents();
    return { success: true, message: 'Active incidents loaded', data };
  }

  @Get('my') // <- Dipindah ke atas agar tidak terbaca sebagai :incident_id
  @Roles(Role.WARGA)
  @ApiOperation({ summary: 'Track My Incident Reports (Warga Only)' })
  async getMyIncidents(@CurrentUser() user: any) {
    const data = await this.incidentsService.getMyIncidents(user.id);
    return { success: true, message: 'My incidents loaded', data };
  }

  @Get(':incident_id')
  @Roles(Role.WARGA, Role.LINMAS, Role.KOORDINATOR)
  @ApiOperation({
    summary: 'Get Incident Detail (Includes Rating & Private URL)',
  })
  async getIncidentDetail(@Param('incident_id') incidentId: string) {
    const data = await this.incidentsService.getIncidentDetail(incidentId);
    return { success: true, message: 'Incident detail loaded', data };
  }

  @Post(':incident_id/claim')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Claim Incident ("Saya Tangani")' })
  async claimIncident(
    @CurrentUser() user: any,
    @Param('incident_id') incidentId: string,
  ) {
    // Linmas ID diambil langsung dari token, tidak perlu Body DTO
    const data = await this.incidentsService.claimIncident(incidentId, user.id);
    return { success: true, message: 'Incident claimed', data };
  }

  @Patch(':incident_id/status')
  @Roles(Role.LINMAS, Role.KOORDINATOR)
  @ApiOperation({ summary: 'Update Incident Status (To Selesai/Dialihkan)' })
  async updateIncidentStatus(
    @CurrentUser() user: any,
    @Param('incident_id') incidentId: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    await this.incidentsService.updateIncidentStatus(incidentId, user.id, dto);
    return { success: true, message: 'Incident status updated' };
  }

  @Post(':incident_id/intervene')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Intervene / Reassign Incident (Koordinator)' })
  async interveneIncident(
    @Param('incident_id') incidentId: string,
    @Body() dto: InterveneIncidentDto,
  ) {
    await this.incidentsService.interveneIncident(incidentId, dto);
    return { success: true, message: 'Incident reassigned' };
  }

  @Post(':incident_id/rating')
  @Roles(Role.WARGA)
  @ApiOperation({ summary: 'Give Rating & Review to Finished Incident' })
  async createIncidentRating(
    @CurrentUser() user: any,
    @Param('incident_id') incidentId: string,
    @Body() dto: CreateIncidentRatingDto,
  ) {
    const data = await this.incidentsService.createIncidentRating(
      incidentId,
      user.id,
      dto,
    );
    return { success: true, message: 'Rating submitted successfully', data };
  }
}
