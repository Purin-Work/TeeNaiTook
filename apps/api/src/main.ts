import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { getConfig } from './common/config';
async function bootstrap() {
  getConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  await app.listen(getConfig().PORT, '0.0.0.0');
}
void bootstrap();
