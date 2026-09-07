import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors';

@Injectable()
export class AuthService {
  private readonly dummyHash = hash('constant-time-missing-account-check', 12);
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    const valid = await compare(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !valid || user.role !== 'ADMIN')
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
    return {
      token: await this.jwt.signAsync({ sub: user.id, role: user.role }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
  async verify(token: string) {
    try {
      const claims = await this.jwt.verifyAsync<{ sub: string; role: string }>(token);
      const user = await this.db.user.findUnique({
        where: { id: claims.sub },
        select: { id: true, email: true, role: true },
      });
      if (!user || user.role !== 'ADMIN') throw new Error('unauthorized');
      return user;
    } catch {
      throw new AppError('AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ', 401);
    }
  }
}
