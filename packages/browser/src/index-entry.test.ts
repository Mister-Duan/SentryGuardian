import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { captureException, init } from './index.js';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

describe('main entry', () => {
  it('exports core SDK without performance integrations', () => {
    expect(typeof init).toBe('function');
    expect(typeof captureException).toBe('function');
  });

  it('dist/index.js does not bundle perfume initPerfume', () => {
    const mainBundle = readFileSync(join(distDir, 'index.js'), 'utf8');
    expect(mainBundle).not.toContain('initPerfume');
    expect(mainBundle).not.toMatch(/from ['"]perfume\.js['"]/);
  });
});
