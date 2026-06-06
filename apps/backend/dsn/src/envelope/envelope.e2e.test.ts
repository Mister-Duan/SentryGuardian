import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { text } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createEnvelope, createTransactionsEnvelope, serializeEnvelope } from '@sentry-guardian/core';
import type { ErrorEvent, TransactionEvent } from '@sentry-guardian/types';
import { PrismaModule } from '@sentry-guardian/nest-prisma';
import { EnvelopeModule } from './envelope.module.js';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('Envelope ingest (contract)', () => {
  let app: INestApplication;
  let projectId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, EnvelopeModule],
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

  it('POST /api/sentry/envelope/:projectId stores event', async () => {
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
      .post(`/api/sentry/envelope/${projectId}`)
      .set('Content-Type', 'application/x-sentry-guardian-envelope')
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.stored).toBe(1);

    const dup = await request(app.getHttpServer())
      .post(`/api/sentry/envelope/${projectId}`)
      .set('Content-Type', 'application/x-sentry-guardian-envelope')
      .send(body);

    expect(dup.status).toBe(201);
    expect(dup.body.stored).toBe(0);
  });

  it('POST /api/sentry/envelope/:projectId stores multiple transactions in one envelope', async () => {
    const sdk = { name: 'test', version: '0.1.0' };
    const txs: TransactionEvent[] = [
      {
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'transaction',
        transaction: 'time-to-first-byte',
        duration_ms: 100,
        metric: 'TTFB',
        metric_value: 100,
        sdk,
      },
      {
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'transaction',
        transaction: 'first-contentful-paint',
        duration_ms: 200,
        metric: 'FCP',
        metric_value: 200,
        sdk,
      },
    ];
    const envelope = createTransactionsEnvelope(txs, sdk);
    const body = serializeEnvelope(envelope);

    const res = await request(app.getHttpServer())
      .post(`/api/sentry/envelope/${projectId}`)
      .set('Content-Type', 'application/x-sentry-guardian-envelope')
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.stored).toBe(2);
  });
});
