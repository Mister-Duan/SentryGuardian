import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module.js';

const DEFAULT_PORT = 3002;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });
  app.use(json({ limit: '256kb' }));
  app.setGlobalPrefix('api', { exclude: ['health'] });
  const port = Number(process.env.MONITOR_PORT ?? DEFAULT_PORT);
  await app.listen(port);
  console.log(`Monitor API listening on http://localhost:${port}`);
}

void bootstrap();
