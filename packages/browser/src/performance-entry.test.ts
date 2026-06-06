import { describe, expect, it } from 'vitest';
import { markNTBT, performanceIntegration } from './performance.js';

describe('performance entry', () => {
  it('exports performanceIntegration', () => {
    expect(typeof performanceIntegration).toBe('function');
    expect(performanceIntegration().name).toBe('Performance');
  });

  it('re-exports perfume SPA helpers', () => {
    expect(typeof markNTBT).toBe('function');
  });
});
