import { Body, Controller, Get, Module, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiCookieAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminGuard, verifyOrigin } from './auth.guard';
import { getConfig } from '../common/config';

class LoginDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ minLength: 12 }) @IsString() @MinLength(12) @MaxLength(72) password!: string;
}
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    verifyOrigin(request.headers.origin);
    const { token, user } = await this.auth.login(body.email, body.password);
    response.cookie('tnt_session', token, {
      httpOnly: true,
      secure: getConfig().NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
      maxAge: getConfig().JWT_EXPIRES_IN * 1000,
    });
    response.setHeader('Cache-Control', 'no-store');
    return { user };
  }
  @Post('logout')
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    verifyOrigin(request.headers.origin);
    response.clearCookie('tnt_session', {
      httpOnly: true,
      secure: getConfig().NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
    });
    return { success: true };
  }
  @Get('me')
  @UseGuards(AdminGuard)
  @ApiCookieAuth()
  async me(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    const cookies = request.cookies as Record<string, string>;
    return { user: await this.auth.verify(cookies.tnt_session) };
  }
}
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getConfig().JWT_SECRET,
        signOptions: {
          expiresIn: getConfig().JWT_EXPIRES_IN,
          issuer: 'teenaitook',
          audience: 'teenaitook-admin',
        },
        verifyOptions: {
          issuer: 'teenaitook',
          audience: 'teenaitook-admin',
          algorithms: ['HS256'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}
