import { describe, expect, it } from 'vitest';
import {
  clearAllIssueFilters,
  clearIssueFilter,
  formatFilterDisplayValue,
  getActiveIssueFilters,
  getAvailableAddFilterFields,
  mergeFilterOptions,
  setIssueFilter,
} from './issue-filters.js';

describe('issue-filters', () => {
  const base = {
    project_id: 'p1',
    status: 'unresolved' as const,
    environment: '',
    exception_type: '',
    mechanism: '',
    level: '',
  };

  const context = {
    projects: [{ id: 'p1', name: 'Demo App' }],
    exceptionTypeOptions: ['TypeError'],
    mechanismOptions: ['onerror'],
  };

  it('getActiveIssueFilters lists project and taxonomy fields', () => {
    expect(
      getActiveIssueFilters({
        ...base,
        exception_type: 'TypeError',
        mechanism: 'onerror',
      }),
    ).toEqual([
      { field: 'project_id', value: 'p1', removable: false },
      { field: 'status', value: 'unresolved' },
      { field: 'exception_type', value: 'TypeError' },
      { field: 'mechanism', value: 'onerror' },
    ]);
  });

  it('formatFilterDisplayValue resolves project name', () => {
    expect(formatFilterDisplayValue('project_id', 'p1', context)).toBe('Demo App');
    expect(formatFilterDisplayValue('mechanism', 'onerror', context)).toBe('全局错误');
  });

  it('getAvailableAddFilterFields excludes active optional filters', () => {
    expect(getAvailableAddFilterFields({ ...base, level: 'error' })).not.toContain('level');
    expect(getAvailableAddFilterFields(base)).not.toContain('project_id');
  });

  it('clearIssueFilter does not remove project_id', () => {
    expect(clearIssueFilter(base, 'project_id')).toEqual(base);
  });

  it('clearAllIssueFilters keeps project scope', () => {
    expect(
      clearAllIssueFilters({
        ...base,
        exception_type: 'TypeError',
        level: 'error',
      }),
    ).toEqual({
      ...base,
      status: 'all',
      exception_type: '',
      level: '',
    });
  });

  it('mergeFilterOptions includes active value', () => {
    expect(mergeFilterOptions(['TypeError'], 'ReferenceError')).toEqual([
      'ReferenceError',
      'TypeError',
    ]);
  });
});
