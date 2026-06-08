import { describe, expect, it } from 'vitest';
import { SourceMapConsumer } from 'source-map';
import { extractSourceContext } from './source-context.js';

const MAP = {
  version: 3,
  file: 'app.js',
  sources: ['src/demo.ts'],
  sourcesContent: ['line1\nthrow new Error("x")\nline3'],
  mappings: 'AAAA,SAASA',
};

describe('extractSourceContext', () => {
  it('returns lines around error with highlight', async () => {
    const consumer = await new SourceMapConsumer(MAP);
    try {
      const ctx = extractSourceContext(consumer, 'src/demo.ts', 2, 0, 1);
      expect(ctx).toHaveLength(3);
      expect(ctx.find((l) => l.is_error_line)?.content).toContain('throw new Error');
    } finally {
      consumer.destroy();
    }
  });

  it('returns empty when no source content', async () => {
    const consumer = await new SourceMapConsumer({
      version: 3,
      file: 'app.js',
      sources: ['missing.ts'],
      mappings: 'AAAA',
    });
    try {
      expect(extractSourceContext(consumer, 'missing.ts', 1, 0)).toEqual([]);
    } finally {
      consumer.destroy();
    }
  });
});
