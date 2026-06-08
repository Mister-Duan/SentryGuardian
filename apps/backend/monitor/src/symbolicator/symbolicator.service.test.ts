import { afterEach, describe, expect, it, vi } from 'vitest';
import { SourceMapGenerator } from 'source-map';
import type { ErrorEvent, StackFrame } from '@sentry-guardian/types';
import { SymbolicatorService } from './symbolicator.service.js';

function buildTestMap(): string {
  const gen = new SourceMapGenerator({ file: 'app.js' });
  gen.addMapping({
    generated: { line: 1, column: 0 },
    source: 'src/app.ts',
    original: { line: 10, column: 4 },
    name: 'throwError',
  });
  gen.setSourceContent(
    'src/app.ts',
    'function throwError() {\n  throw new Error("test");\n}',
  );
  return gen.toString();
}

function errorEvent(frames: StackFrame[], release = '1.0.0'): ErrorEvent {
  return {
    event_id: 'evt-1',
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    release,
    sdk: { name: 'test', version: '0' },
    exception: {
      values: [
        {
          type: 'Error',
          value: 'boom',
          stacktrace: { frames },
        },
      ],
    },
  };
}

describe('SymbolicatorService', () => {
  let service: SymbolicatorService;

  afterEach(() => {
    service?.onModuleDestroy();
  });

  it('symbolicates stack frames at lineno 1 without throwing', async () => {
    const mapJson = buildTestMap();
    const prisma = {
      release: {
        findUnique: vi.fn().mockResolvedValue({
          artifacts: [
            {
              name: 'app.js.map',
              sourceMap: mapJson,
              bundleUrl: 'http://localhost/assets/app.js',
              debugId: null,
              artifactType: 'map',
            },
          ],
        }),
      },
    };
    service = new SymbolicatorService(prisma as never);
    const event = errorEvent([
      {
        filename: 'http://localhost/assets/app.js',
        function: '?',
        lineno: 1,
        colno: 1,
        in_app: true,
      },
    ]);

    const result = await service.symbolicateEvent('proj_1', event);
    const frame = result.exception?.values?.[0]?.stacktrace?.frames?.[0];

    expect(frame?.symbolicated).toBe(true);
    expect(frame?.map_matched).toBe(true);
    expect(frame?.filename).toBe('src/app.ts');
    expect(frame?.function).toBe('throwError');
    expect(frame?.raw).toEqual({
      filename: 'http://localhost/assets/app.js',
      lineno: 1,
      colno: 1,
    });
    expect(frame?.lineno).toBeGreaterThanOrEqual(1);
  });

  it('returns frame unchanged when lineno is invalid', async () => {
    const mapJson = buildTestMap();
    const prisma = {
      release: {
        findUnique: vi.fn().mockResolvedValue({
          artifacts: [
            {
              name: 'app.js.map',
              sourceMap: mapJson,
              bundleUrl: 'http://localhost/assets/app.js',
              debugId: null,
              artifactType: 'map',
            },
          ],
        }),
      },
    };
    service = new SymbolicatorService(prisma as never);
    const event = errorEvent([
      {
        filename: 'http://localhost/assets/app.js',
        function: '?',
        lineno: 0,
        in_app: true,
      },
    ]);

    const result = await service.symbolicateEvent('proj_1', event);
    const frame = result.exception?.values?.[0]?.stacktrace?.frames?.[0];

    expect(frame?.symbolicated).toBe(false);
    expect(frame?.map_matched).toBe(false);
    expect(frame?.lineno).toBe(0);
  });

  it('marks frames unmatched when release has no artifacts', async () => {
    const prisma = {
      release: {
        findUnique: vi.fn().mockResolvedValue({ artifacts: [] }),
      },
    };
    service = new SymbolicatorService(prisma as never);
    const event = errorEvent([
      {
        filename: 'http://localhost/assets/app.js',
        function: 'main',
        lineno: 5,
        in_app: true,
      },
    ]);

    const result = await service.symbolicateEvent('proj_1', event);
    const frame = result.exception?.values?.[0]?.stacktrace?.frames?.[0];

    expect(frame?.map_matched).toBe(false);
    expect(frame?.symbolicated).toBeUndefined();
  });

  it('returns event unchanged when release is missing', async () => {
    const prisma = { release: { findUnique: vi.fn() } };
    service = new SymbolicatorService(prisma as never);
    const event = errorEvent([
      { filename: 'app.js', function: 'main', lineno: 1, in_app: true },
    ]);
    delete event.release;

    const result = await service.symbolicateEvent('proj_1', event);

    expect(result).toBe(event);
    expect(prisma.release.findUnique).not.toHaveBeenCalled();
  });
});
