import { describe, expect, it } from 'vitest';
import { SourceMapConsumer } from 'source-map';
import {
  basename,
  buildArtifactIndex,
  bundleUrlFromFrame,
  normalizeBundleUrl,
  parseDebugIdFromMap,
  resolveArtifactForFrame,
} from './symbolicator.logic.js';

describe('normalizeBundleUrl', () => {
  it('strips query and hash from http URLs', () => {
    expect(normalizeBundleUrl('https://cdn.example.com/assets/app.js?v=1#x')).toBe(
      'https://cdn.example.com/assets/app.js',
    );
  });

  it('normalizes webpack prefix', () => {
    expect(normalizeBundleUrl('webpack:///./src/App.tsx')).toBe('./src/App.tsx');
  });

  it('strips query from relative paths', () => {
    expect(normalizeBundleUrl('/assets/main.js?hash=abc')).toBe('/assets/main.js');
  });
});

describe('bundleUrlFromFrame', () => {
  it('removes .map suffix', () => {
    expect(bundleUrlFromFrame('https://localhost/assets/index.js.map')).toBe(
      'https://localhost/assets/index.js',
    );
  });
});

describe('parseDebugIdFromMap', () => {
  it('reads debugId field', () => {
    const json = JSON.stringify({ version: 3, debugId: 'abc-123' });
    expect(parseDebugIdFromMap(json)).toBe('abc-123');
  });
});

describe('buildArtifactIndex and resolveArtifactForFrame', () => {
  const mapJson = JSON.stringify({
    version: 3,
    file: 'main.js',
    sources: ['src/app.ts'],
    mappings: 'AAAA',
  });

  it('matches by bundle URL', () => {
    const index = buildArtifactIndex([
      {
        name: 'main.js.map',
        sourceMap: mapJson,
        bundleUrl: 'https://localhost/assets/main.js',
        artifactType: 'map',
      },
    ]);
    const frame = resolveArtifactForFrame(
      { filename: 'https://localhost/assets/main.js', lineno: 1 },
      index,
    );
    expect(frame?.name).toBe('main.js.map');
  });

  it('matches by basename', () => {
    const index = buildArtifactIndex([
      { name: 'chunk-abc.js.map', sourceMap: mapJson, artifactType: 'map' },
    ]);
    const frame = resolveArtifactForFrame(
      { filename: 'https://cdn.example.com/chunk-abc.js', lineno: 10 },
      index,
    );
    expect(frame?.name).toBe('chunk-abc.js.map');
  });

  it('falls back to single map artifact', () => {
    const index = buildArtifactIndex([
      { name: 'only.js.map', sourceMap: mapJson, artifactType: 'map' },
    ]);
    const frame = resolveArtifactForFrame(
      { filename: 'https://other/unknown.js', lineno: 1 },
      index,
    );
    expect(frame?.name).toBe('only.js.map');
  });

  it('indexes source artifacts separately', () => {
    const index = buildArtifactIndex([
      { name: 'app.js.map', sourceMap: mapJson, artifactType: 'map' },
      { name: 'src/app.ts', sourceMap: 'console.log(1)', artifactType: 'source' },
    ]);
    expect(index.sources.get('src/app.ts')).toBe('console.log(1)');
    expect(index.maps).toHaveLength(1);
  });
});

describe('basename', () => {
  it('returns last path segment', () => {
    expect(basename('https://x.com/a/b/main.js')).toBe('main.js');
  });
});

describe('source-map generated position', () => {
  it('uses 1-based line numbers from stack frames', async () => {
    const consumer = await new SourceMapConsumer({
      version: 3,
      file: 'app.js',
      sources: ['src/app.ts'],
      mappings: 'AAAA',
    });
    try {
      expect(() => consumer.originalPositionFor({ line: 0, column: 0 })).toThrow(/>= 1/);
      expect(() => consumer.originalPositionFor({ line: 1, column: 0 })).not.toThrow();
    } finally {
      consumer.destroy();
    }
  });
});
