import { describe, expect, it } from 'vitest';
import {
  displayStackFrames,
  formatBreadcrumbTime,
  formatExceptionTitle,
  formatFrameLocation,
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

describe('displayStackFrames', () => {
  it('reverses frames for newest-first display', () => {
    const frames = [
      { filename: 'a.js', lineno: 1 },
      { filename: 'b.js', lineno: 2 },
    ];
    expect(displayStackFrames(frames).map((f) => f.filename)).toEqual(['b.js', 'a.js']);
  });
});
