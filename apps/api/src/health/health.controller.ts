import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly db: PrismaService) {}
  @Get()
  async health() {
    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database unavailable',
      });
    }
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  }
}
