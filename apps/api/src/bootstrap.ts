import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { Express, Request, Response, NextFunction } from 'express';
import { json } from 'express';
import { getConfig } from './common/config';
import { ApiExceptionFilter } from './common/errors';

export function configureApp(app: INestApplication) {
  const env = getConfig();
  const express = app.getHttpAdapter().getInstance() as Express;
  express.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(json({ limit: '64kb' }));
  app.use(cookieParser());
  app.enableCors({ origin: env.FRONTEND_URL.split(',').map((v) => v.trim()), credentials: true });
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'คำขอมากเกินไป กรุณารอสักครู่' } },
    }),
  );
  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 900000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        error: { code: 'AUTH_RATE_LIMITED', message: 'ลองเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที' },
      },
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (/^\/api\/(admin|auth|internal)/.test(request.path))
      response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  if (env.SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('TeeNaiTook API')
      .setDescription(
        'Thai IT price comparison. THB decimal prices are serialized as strings. Admin mutations require a session cookie and an allowed Origin header.',
      )
      .setVersion('1.0')
      .addCookieAuth('tnt_session')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
  app.enableShutdownHooks();
}
