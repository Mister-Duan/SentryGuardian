import { describe, expect, it, vi } from 'vitest';
import { ReleasesService } from './releases.service.js';

describe('ReleasesService', () => {
  const mapJson = JSON.stringify({
    version: 3,
    file: 'app.js',
    debugId: 'debug-1',
    sources: ['src/a.ts'],
    mappings: 'AAAA',
  });

  it('uploadArtifact persists metadata for maps', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      release: {
        findFirst: vi.fn().mockResolvedValue({ id: 'rel_1', projectId: 'p1' }),
      },
      artifact: { upsert },
    };
    const service = new ReleasesService(prisma as never);
    await service.uploadArtifact('p1', 'rel_1', 'app.js.map', mapJson, {
      bundle_url: 'https://cdn/app.js',
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          bundleUrl: 'https://cdn/app.js',
          debugId: 'debug-1',
          artifactType: 'map',
        }),
      }),
    );
  });

  it('uploadArtifact rejects oversized content', async () => {
    const prisma = {
      release: { findFirst: vi.fn().mockResolvedValue({ id: 'rel_1' }) },
      artifact: { upsert: vi.fn() },
    };
    const service = new ReleasesService(prisma as never);
    const huge = 'x'.repeat(5_242_881);
    await expect(service.uploadArtifact('p1', 'rel_1', 'big.map', huge)).rejects.toThrow(
      'Source map too large',
    );
  });
});
