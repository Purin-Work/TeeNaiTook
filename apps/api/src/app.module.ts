import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.service';
import { ProductsModule } from './products/products.controller';
import { AuthModule } from './auth/auth.controller';
import { AdminModule } from './admin/admin.controller';
import { HealthController } from './health/health.controller';
@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), ProductsModule, AuthModule, AdminModule],
  controllers: [HealthController],
})
export class AppModule {}
