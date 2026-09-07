import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AppError } from '../common/errors';
import { getConfig } from '../common/config';

export function verifyOrigin(origin: string | undefined) {
  if (
    !origin ||
    !getConfig()
      .FRONTEND_URL.split(',')
      .map((s) => s.trim())
      .includes(origin)
  ) {
    throw new AppError('INVALID_ORIGIN', 'คำขอไม่ถูกต้อง กรุณาเปิดจากเว็บไซต์ TeeNaiTook', 403);
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = cookies?.tnt_session;
    if (typeof token !== 'string') throw new AppError('AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ', 401);
    await this.auth.verify(token);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) verifyOrigin(request.headers.origin);
    return true;
  }
}
