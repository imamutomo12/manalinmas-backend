import { Controller, Get, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('My Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('my/incidents')
export class MyIncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(Role.WARGA)
  @ApiOperation({ summary: 'Track My Incident Reports (Warga Only)' })
  async getMyIncidents(@CurrentUser() user: any) {
    const data = await this.incidentsService.getMyIncidents(user.id);
    return { success: true, message: 'My incidents loaded', data };
  }
}
