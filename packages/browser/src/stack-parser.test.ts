import { describe, expect, it } from 'vitest';
import { parseStack } from './stack-parser.js';

describe('parseStack', () => {
  it('parses chrome-style frames', () => {
    const stack = ['Error: boom', '    at foo (http://localhost/app.js:10:5)'].join('\n');
    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      filename: 'http://localhost/app.js',
      function: 'foo',
      lineno: 10,
      colno: 5,
    });
  });

  it('returns empty for missing stack', () => {
    expect(parseStack(undefined)).toEqual([]);
  });
});
