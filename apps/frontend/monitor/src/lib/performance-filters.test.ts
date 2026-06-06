import { describe, expect, it } from 'vitest';
import {
  clearAllPerformanceFilters,
  getActivePerformanceFilters,
  getAvailablePerformanceAddFields,
  setPerformanceFilter,
} from './performance-filters.js';

describe('performance-filters', () => {
  it('lists project and metric pills', () => {
    const active = getActivePerformanceFilters({
      project_id: 'p1',
      metric: 'LCP',
    });
    expect(active).toHaveLength(2);
    expect(active[0]?.field).toBe('project_id');
    expect(active[1]?.field).toBe('metric');
  });

  it('hides add-filter when metric is set', () => {
    expect(
      getAvailablePerformanceAddFields({ project_id: 'p1', metric: 'LCP' }),
    ).toHaveLength(0);
  });

  it('clears optional filters only', () => {
    const next = clearAllPerformanceFilters({ project_id: 'p1', metric: 'http.client' });
    expect(next.metric).toBe('');
    expect(next.project_id).toBe('p1');
    expect(setPerformanceFilter(next, 'metric', 'CLS').metric).toBe('CLS');
  });
});
