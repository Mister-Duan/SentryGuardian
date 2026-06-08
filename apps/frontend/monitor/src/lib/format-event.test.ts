import { describe, expect, it } from 'vitest';
import {
  displayBreadcrumbs,
  displayStackFrames,
  formatBreadcrumbTime,
  formatExceptionTitle,
  formatFrameLocation,
  inferInAppFromCulprit,
  resolveIssueCulpritInApp,
} from './format-event.js';

describe('formatFrameLocation', () => {
  it('formats filename, function, line and column', () => {
    expect(
      formatFrameLocation({
        filename: 'app.js',
        function: 'onClick',
        lineno: 12,
        colno: 4,
      }),
    ).toBe('onClick (app.js:12:4)');
  });

  it('falls back when fields are missing', () => {
    expect(formatFrameLocation({})).toBe('<anonymous> (?)');
  });
});

describe('formatExceptionTitle', () => {
  it('joins type and value', () => {
    expect(formatExceptionTitle({ type: 'TypeError', value: 'x is undefined' })).toBe(
      'TypeError: x is undefined',
    );
  });
});

describe('formatBreadcrumbTime', () => {
  it('returns dash when timestamp is missing', () => {
    expect(formatBreadcrumbTime()).toBe('—');
  });

  it('formats unix seconds to locale string', () => {
    const formatted = formatBreadcrumbTime(1717416000);
    expect(formatted).toMatch(/\d/);
  });
});

describe('displayBreadcrumbs', () => {
  it('sorts by timestamp descending', () => {
    const sorted = displayBreadcrumbs([
      { timestamp: 10, message: 'mid' },
      { timestamp: 20, message: 'new' },
      { timestamp: 5, message: 'old' },
    ]);
    expect(sorted.map((c) => c.message)).toEqual(['new', 'mid', 'old']);
  });
});

describe('displayStackFrames', () => {
  it('reverses frames for newest-first display', () => {
    const frames = [
      { filename: 'a.js', lineno: 1 },
      { filename: 'b.js', lineno: 2 },
    ];
    expect(displayStackFrames(frames).map((f) => f.filename)).toEqual(['b.js', 'a.js']);
  });
});

describe('inferInAppFromCulprit', () => {
  it('marks app paths as in-app', () => {
    expect(inferInAppFromCulprit('http://localhost/src/App.tsx:42')).toBe(true);
  });

  it('marks node_modules as library', () => {
    expect(inferInAppFromCulprit('webpack:///node_modules/react/index.js:1')).toBe(false);
  });
});

describe('resolveIssueCulpritInApp', () => {
  it('prefers stored flag over inference', () => {
    expect(resolveIssueCulpritInApp('node_modules/x.js:1', true)).toBe(true);
  });

  it('infers when stored flag is missing', () => {
    expect(resolveIssueCulpritInApp('http://localhost/app.js:10')).toBe(true);
  });
});
