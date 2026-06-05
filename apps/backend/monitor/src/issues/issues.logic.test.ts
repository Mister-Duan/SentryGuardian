import { describe, expect, it } from 'vitest';
import { eventTitle } from '../grouper/grouper.logic.js';

describe('IssuesService filters', () => {
  it('eventTitle extracts message', () => {
    expect(eventTitle({ exception: { values: [{ type: 'Error', value: 'boom' }] } })).toBe('boom');
  });
});
