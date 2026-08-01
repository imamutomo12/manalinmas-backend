import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterWargaDto } from './dto/register-warga.dto';
import { RegisterLinmasDto } from './dto/register-linmas.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/warga')
  @ApiOperation({ summary: 'Register as Warga' })
  async registerWarga(@Body() dto: RegisterWargaDto) {
    const data = await this.authService.registerWarga(dto);
    return { success: true, message: 'Warga registered successfully', data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KOORDINATOR)
  @ApiBearerAuth()
  @Post('register/linmas')
  @ApiOperation({ summary: 'Register a Linmas Officer (Koordinator Only)' })
  async registerLinmas(@Body() dto: RegisterLinmasDto) {
    const data = await this.authService.registerLinmas(dto);
    return { success: true, message: 'Linmas registered successfully', data };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login for all roles' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, message: 'Login success', data };
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh Access Token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(dto.refresh_token);
    return { success: true, message: 'Token refreshed', data };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear FCM Token' })
  async logout(@CurrentUser() user: any, @Body() dto: LogoutDto) {
    await this.authService.logout(user.id, dto.fcm_token);
    return { success: true, message: 'Logout success' };
  }
}
