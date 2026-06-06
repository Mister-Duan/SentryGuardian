import { describe, expect, it } from 'vitest';
import { eventTitle } from '../grouper/grouper.logic.js';
import { buildIssueListWhere } from './issues.logic.js';

describe('IssuesService filters', () => {
  it('eventTitle extracts message', () => {
    expect(eventTitle({ exception: { values: [{ type: 'Error', value: 'boom' }] } })).toBe('boom');
  });

  it('buildIssueListWhere maps taxonomy filters to Prisma fields', () => {
    expect(
      buildIssueListWhere({
        project_id: 'p1',
        exception_type: 'TypeError',
        mechanism: 'onerror',
        level: 'error',
        since: '2026-06-06T00:00:00.000Z',
        until: '2026-06-06T12:00:00.000Z',
      }),
    ).toEqual({
      projectId: 'p1',
      exceptionType: 'TypeError',
      mechanism: 'onerror',
      level: 'error',
      lastSeen: {
        gte: new Date('2026-06-06T00:00:00.000Z'),
        lte: new Date('2026-06-06T12:00:00.000Z'),
      },
    });
  });

  it('buildIssueListWhere omits empty taxonomy filters', () => {
    expect(buildIssueListWhere({ project_id: 'p1' })).toEqual({ projectId: 'p1' });
  });
});
