import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { text } from 'express';
import { AppModule } from './app.module.js';

const DEFAULT_PORT = 3001;

/**
 * Bootstrap the ingest (DSN) HTTP server.
 * 启动 ingest（DSN）HTTP 服务。
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    methods: ['POST', 'GET', 'OPTIONS'],
  });
  app.use(
    text({
      type: ['application/x-sentry-guardian-envelope', 'text/plain', 'application/json'],
      limit: process.env.MAX_ENVELOPE_BYTES ?? '1048576',
    }),
  );
  const port = Number(process.env.DSN_PORT ?? DEFAULT_PORT);
  await app.listen(port);
  console.log(`DSN ingest listening on http://localhost:${port}`);
}

void bootstrap();
