#!/usr/bin/env node
/**
 * Upload source map artifacts to a SentryGuardian release.
 * 向 SentryGuardian Release 上传 Source Map。
 *
 * Usage:
 *   node scripts/upload-sourcemaps.mjs --release 1.0.0 --project-id <id> --token <jwt> --dir ./dist
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce<string[][]>((acc, cur, i, arr) => {
    if (cur.startsWith('--')) {
      acc.push([cur.slice(2), arr[i + 1] ?? '']);
    }
    return acc;
  }, []),
);

const apiBase = process.env.MONITOR_API_URL ?? 'http://localhost:3002';
const projectId = args['project-id'];
const token = args.token;
const version = args.release;
const dir = args.dir ?? './dist';

if (!projectId || !token || !version) {
  console.error('Required: --project-id --token --release [--dir]');
  process.exit(1);
}

async function main(): Promise<void> {
  const releaseRes = await fetch(`${apiBase}/api/projects/${projectId}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version }),
  });
  if (!releaseRes.ok) {
    throw new Error(`Create release failed: ${releaseRes.status}`);
  }
  const release = (await releaseRes.json()) as { id: string };

  const files = await readdir(dir);
  const maps = files.filter((f) => f.endsWith('.map'));
  for (const name of maps) {
    const content = await readFile(join(dir, name), 'utf8');
    const form = new FormData();
    form.append('file', new Blob([content], { type: 'application/json' }), name);
    const res = await fetch(
      `${apiBase}/api/projects/${projectId}/releases/${release.id}/artifacts`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
    if (!res.ok) {
      throw new Error(`Upload ${name} failed: ${res.status}`);
    }
    console.log(`Uploaded ${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
