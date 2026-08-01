import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReguService } from './regu.service';
import { CreateReguDto } from './dto/create-regu.dto';
import { UpdateReguDto } from './dto/update-regu.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Regu (Squads)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regu')
export class ReguController {
  constructor(private readonly reguService: ReguService) {}

  @Post()
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Create a new Regu (Koordinator Only)' })
  async createRegu(@Body() dto: CreateReguDto) {
    const data = await this.reguService.createRegu(dto);
    return { success: true, message: 'Regu created successfully', data };
  }

  @Get()
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get list of all Regu' })
  async getRegus() {
    const data = await this.reguService.getRegus();
    return { success: true, message: 'Regu list loaded', data };
  }

  @Get(':regu_id')
  @Roles(Role.KOORDINATOR, Role.LINMAS)
  @ApiOperation({ summary: 'Get Regu details and members' })
  async getReguById(@Param('regu_id') reguId: string) {
    const data = await this.reguService.getReguById(reguId);
    return { success: true, message: 'Regu details loaded', data };
  }

  @Put(':regu_id')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Update Regu (Koordinator Only)' })
  async updateRegu(
    @Param('regu_id') reguId: string,
    @Body() dto: UpdateReguDto,
  ) {
    await this.reguService.updateRegu(reguId, dto);
    return { success: true, message: 'Regu updated successfully' };
  }

  @Delete(':regu_id')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Delete Regu (Koordinator Only)' })
  async deleteRegu(@Param('regu_id') reguId: string) {
    await this.reguService.deleteRegu(reguId);
    return { success: true, message: 'Regu deleted successfully' };
  }
}
