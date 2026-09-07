import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

export class AppError extends HttpException {
  constructor(code: string, message: string, status = 400) {
    super({ code, message }, status);
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let payload: { code: string; message: string | string[] } = {
      code: 'INTERNAL_ERROR',
      message: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่',
    };
    if (error instanceof HttpException) {
      status = error.getStatus();
      const body = error.getResponse();
      if (typeof body === 'object' && body !== null) {
        const value = body as { code?: string; message?: string | string[] };
        payload = { code: value.code || `HTTP_${status}`, message: value.message || error.message };
      } else payload = { code: `HTTP_${status}`, message: String(body) };
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        status = 409;
        payload = { code: 'DUPLICATE_RECORD', message: 'ข้อมูลนี้มีอยู่แล้ว' };
      }
      if (error.code === 'P2025') {
        status = 404;
        payload = { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล' };
      }
      if (error.code === 'P2003') {
        status = 400;
        payload = { code: 'INVALID_REFERENCE', message: 'ข้อมูลอ้างอิงไม่ถูกต้อง' };
      }
    }
    // Never log raw exception messages: driver errors can include connection strings.
    this.logger.warn(JSON.stringify({ event: 'request_error', status, code: payload.code }));
    response.status(status).json({ error: payload, timestamp: new Date().toISOString() });
  }
}
