import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { CreateLinmasDto } from './dto/create-linmas.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.KOORDINATOR)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of users (filterable by role)' })
  async getUsers(@Query() query: GetUsersQueryDto) {
    const data = await this.usersService.getUsers(query.role);
    return { success: true, message: 'Users loaded', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user detail by ID' })
  async getUserById(@Param('id') id: string) {
    const data = await this.usersService.getUserById(id);
    return { success: true, message: 'User detail loaded', data };
  }

  @Post('linmas')
  @ApiOperation({
    summary: 'Create new Linmas member (moved from auth/register)',
  })
  async createLinmas(@Body() dto: CreateLinmasDto) {
    const data = await this.usersService.createLinmas(dto);
    return { success: true, message: 'Anggota Linmas berhasil dibuat', data };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile (nama, HP, email, regu, alamat)',
  })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.updateUser(id, dto);
    return { success: true, message: 'User berhasil diperbarui', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan user (soft delete)' })
  async deleteUser(@Param('id') id: string) {
    const result = await this.usersService.deleteUser(id);
    return result;
  }
}
