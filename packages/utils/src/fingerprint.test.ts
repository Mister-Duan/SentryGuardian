import { describe, expect, it } from 'vitest';
import {
  computeFingerprint,
  computeFallbackFingerprint,
  normalizeFilename,
} from './fingerprint.js';

describe('normalizeFilename', () => {
  it('strips query from URL', () => {
    expect(normalizeFilename('https://example.com/app.js?v=1')).toBe('/app.js');
  });
});

describe('computeFingerprint', () => {
  it('produces stable hash for same frames', () => {
    const frames = [
      { filename: 'https://example.com/app.js?v=1', function: 'main', lineno: 10, in_app: true },
      { filename: 'https://example.com/lib.js', function: 'helper', lineno: 5, in_app: false },
    ];
    const a = computeFingerprint(frames);
    const b = computeFingerprint(frames);
    expect(a).toBe(b);
    expect(a).toMatchSnapshot();
    expect(a).toHaveLength(64);
  });

  it('prefers in_app frames', () => {
    const frames = [
      { filename: 'node:internal', function: 'run', lineno: 1, in_app: false },
      { filename: 'app.js', function: 'main', lineno: 2, in_app: true },
    ];
    const fp = computeFingerprint(frames, 1);
    expect(fp).toHaveLength(64);
  });
});

describe('computeFallbackFingerprint', () => {
  it('hashes type and message', () => {
    const fp = computeFallbackFingerprint('TypeError', 'Cannot read property');
    expect(fp).toHaveLength(64);
    expect(fp).toMatchSnapshot();
  });
});
