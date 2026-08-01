import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegisterWargaDto } from './dto/register-warga.dto';
import { RegisterLinmasDto } from './dto/register-linmas.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerWarga(dto: RegisterWargaDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone_number: dto.phone_number }] },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: dto.email,
          phone_number: dto.phone_number,
          password_hash: hashedPassword,
          role: Role.WARGA,
          wargaProfile: {
            create: {
              fullName: dto.full_name,
              address: dto.address,
            },
          },
        },
      });
      return newUser;
    });

    const tokens = this.generateTokens(user.id, user.role);

    return {
      user_id: user.id,
      role: user.role,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async registerLinmas(dto: RegisterLinmasDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone_number: dto.phone_number }] },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: dto.email,
          phone_number: dto.phone_number,
          password_hash: hashedPassword,
          role: Role.LINMAS,
          linmasProfile: {
            create: {
              fullName: dto.full_name,
              address: dto.address,
              employmentDate: new Date(dto.employment_date),
              reguId: dto.regu_id, // <-- Add this line
            },
          },
        },
      });
      return newUser;
    });

    return {
      linmas_id: user.id,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone_number: dto.identifier }],
      },
      include: {
        wargaProfile: true,
        linmasProfile: true,
        koordinatorProfile: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (dto.fcm_token) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { fcm_token: dto.fcm_token },
      });
    }

    const tokens = this.generateTokens(user.id, user.role);

    let fullName = '';

    switch (user.role) {
      case Role.WARGA:
        fullName = user.wargaProfile?.fullName ?? '';
        break;

      case Role.LINMAS:
        fullName = user.linmasProfile?.fullName ?? '';
        break;

      case Role.KOORDINATOR:
        fullName = user.koordinatorProfile?.fullName ?? '';
        break;
    }

    return {
      user_id: user.id,
      full_name: fullName,
      role: user.role,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: 86400,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET as string,
      });

      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, role: payload.role },
        {
          secret: process.env.JWT_ACCESS_SECRET as string,
          // Cast 'as any' to bypass strict StringValue type checking
          expiresIn: process.env.JWT_ACCESS_EXPIRATION as any,
        },
      );

      return { access_token: newAccessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, fcmToken: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, fcm_token: fcmToken },
      data: { fcm_token: null },
    });
    return true;
  }

  private generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_ACCESS_SECRET as string,
        // Cast 'as any' to bypass strict StringValue type checking
        expiresIn: process.env.JWT_ACCESS_EXPIRATION as any,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET as string,
        // Cast 'as any' to bypass strict StringValue type checking
        expiresIn: process.env.JWT_REFRESH_EXPIRATION as any,
      }),
    };
  }
}
