import { Controller, Get, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Home')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('koordinator')
  @Roles(Role.KOORDINATOR)
  @ApiOperation({ summary: 'Get Koordinator Home Summary' })
  async getKoordinatorHome() {
    const data = await this.homeService.getKoordinatorHome();
    return { success: true, message: 'Koordinator home loaded', data };
  }

  @Get('linmas')
  @Roles(Role.LINMAS)
  @ApiOperation({ summary: 'Get Linmas Home Summary' })
  async getLinmasHome(@CurrentUser() user: any) {
    // We pass the user.id so the service can fetch Linmas-specific shift data
    const data = await this.homeService.getLinmasHome(user.id);
    return { success: true, message: 'Linmas home loaded', data };
  }

  @Get('warga')
  @Roles(Role.WARGA)
  @ApiOperation({ summary: 'Get Warga Home Summary' })
  async getWargaHome(@CurrentUser() user: any) {
    // We pass the user.id so the service can fetch Warga-specific incident data
    const data = await this.homeService.getWargaHome(user.id);
    return { success: true, message: 'Warga home loaded', data };
  }
}
