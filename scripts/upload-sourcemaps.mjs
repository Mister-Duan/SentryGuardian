#!/usr/bin/env node
/**
 * Upload source map artifacts to a SentryGuardian release.
 * 向 SentryGuardian Release 上传 Source Map。
 *
 * Usage:
 *   node scripts/upload-sourcemaps.mjs --release 1.0.0 --project-id <id> --token <jwt> --dir ./dist [--url-prefix https://cdn/app/]
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
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
const urlPrefix = args['url-prefix'];

if (!projectId || !token || !version) {
  console.error('Required: --project-id --token --release [--dir] [--url-prefix]');
  process.exit(1);
}

function parseDebugId(json) {
  try {
    const parsed = JSON.parse(json);
    return parsed.debugId ?? parsed['x_google_debugId'];
  } catch {
    return undefined;
  }
}

function bundleUrlForMap(name) {
  const js = name.endsWith('.map') ? name.slice(0, -4) : name;
  if (!urlPrefix) return undefined;
  const base = js.split('/').pop() ?? js;
  return `${urlPrefix.replace(/\/$/, '')}/${base}`;
}

async function collectMaps(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMaps(full)));
    } else if (entry.name.endsWith('.map')) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
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
  const release = await releaseRes.json();

  const mapPaths = await collectMaps(dir);
  let uploaded = 0;
  let failed = 0;

  for (const path of mapPaths) {
    const name = relative(dir, path);
    const content = await readFile(path, 'utf8');
    const form = new FormData();
    form.append('file', new Blob([content], { type: 'application/json' }), name);
    const debugId = parseDebugId(content);
    const bundleUrl = bundleUrlForMap(name);
    if (debugId) form.append('debug_id', debugId);
    if (bundleUrl) form.append('bundle_url', bundleUrl);
    form.append('artifact_type', 'map');

    const res = await fetch(
      `${apiBase}/api/projects/${projectId}/releases/${release.id}/artifacts`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
    if (!res.ok) {
      console.error(`FAILED ${name}: ${res.status}`);
      failed += 1;
    } else {
      console.log(`Uploaded ${name}${bundleUrl ? ` (${bundleUrl})` : ''}`);
      uploaded += 1;
    }
  }

  console.log(`Done: ${uploaded} uploaded, ${failed} failed, ${mapPaths.length} total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
