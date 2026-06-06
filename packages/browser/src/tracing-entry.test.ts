import { describe, expect, it } from 'vitest';
import { browserTracingIntegration } from './tracing.js';

describe('tracing entry', () => {
  it('exports browserTracingIntegration', () => {
    expect(typeof browserTracingIntegration).toBe('function');
    expect(browserTracingIntegration().name).toBe('BrowserTracing');
  });
});
