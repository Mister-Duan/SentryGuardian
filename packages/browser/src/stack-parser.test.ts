import { describe, expect, it } from 'vitest';
import { isInAppFrame, parseStack } from './stack-parser.js';

describe('isInAppFrame', () => {
  it('marks same-origin app URLs as in-app', () => {
    expect(isInAppFrame('http://localhost/app.js')).toBe(true);
    expect(isInAppFrame('https://example.com/assets/main.js')).toBe(true);
    expect(isInAppFrame('src/App.tsx')).toBe(true);
  });

  it('marks node_modules and runtime internals as not in-app', () => {
    expect(isInAppFrame('webpack:///node_modules/react/index.js')).toBe(false);
    expect(isInAppFrame('/app/node_modules/lodash/lodash.js')).toBe(false);
    expect(isInAppFrame('node:internal/process/task_queues')).toBe(false);
    expect(isInAppFrame('chrome-extension://abc/content.js')).toBe(false);
    expect(isInAppFrame('webpack-internal:///./src/App.tsx')).toBe(false);
    expect(isInAppFrame('<anonymous>')).toBe(false);
  });
});

describe('parseStack', () => {
  it('parses chrome-style frames with in_app', () => {
    const stack = ['Error: boom', '    at foo (http://localhost/app.js:10:5)'].join('\n');
    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      filename: 'http://localhost/app.js',
      function: 'foo',
      lineno: 10,
      colno: 5,
      in_app: true,
    });
  });

  it('marks node_modules frames as not in-app', () => {
    const stack = [
      'Error: boom',
      '    at helper (http://localhost/node_modules/react/index.js:1:1)',
    ].join('\n');
    const frames = parseStack(stack);
    expect(frames[0]?.in_app).toBe(false);
  });

  it('returns empty for missing stack', () => {
    expect(parseStack(undefined)).toEqual([]);
  });
});
