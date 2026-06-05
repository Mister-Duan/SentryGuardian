import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { text } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createEnvelope } from '@sentry-guardian/core';
import { serializeEnvelope } from '@sentry-guardian/core';
import type { ErrorEvent } from '@sentry-guardian/types';
import { AppModule } from '../app.module.js';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Envelope ingest (contract)', () => {
  let app: INestApplication;
  let projectId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(
      text({
        type: ['application/x-sentry-guardian-envelope', 'text/plain', 'application/json'],
      }),
    );
    await app.init();

    const { PrismaService } = await import('@sentry-guardian/nest-prisma');
    const prisma = app.get(PrismaService) as InstanceType<typeof PrismaService>;
    const org = await prisma.organization.findFirst();
    const project = await prisma.project.findFirst({ where: { organizationId: org!.id } });
    projectId = project!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/sentry/:projectId/envelope stores event', async () => {
    const event: ErrorEvent = {
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      message: 'contract test',
      sdk: { name: 'test', version: '0.1.0' },
    };
    const envelope = createEnvelope([event], event.sdk);
    const body = serializeEnvelope(envelope);

    const res = await request(app.getHttpServer())
      .post(`/api/sentry/${projectId}/envelope`)
      .set('Content-Type', 'application/x-sentry-guardian-envelope')
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.stored).toBe(1);

    const dup = await request(app.getHttpServer())
      .post(`/api/sentry/${projectId}/envelope`)
      .set('Content-Type', 'application/x-sentry-guardian-envelope')
      .send(body);

    expect(dup.status).toBe(201);
    expect(dup.body.stored).toBe(0);
  });
});
