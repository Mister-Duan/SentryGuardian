import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = join(dirname(fileURLToPath(import.meta.url)), 'upload-sourcemaps.mjs');

describe('upload-sourcemaps.mjs', () => {
  it('runs as plain JavaScript without TypeScript syntax errors', () => {
    const result = spawnSync(
      process.execPath,
      [script, '--project-id', 'proj', '--token', 'jwt', '--release', '1.0.0', '--dir', '/empty'],
      { encoding: 'utf8' },
    );

    expect(result.stderr).not.toMatch(/SyntaxError/);
  });

  it('exits with usage when required args are missing', () => {
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Required: --project-id --token --release');
  });
});
