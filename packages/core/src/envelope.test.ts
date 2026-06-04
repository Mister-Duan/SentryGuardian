import { describe, expect, it } from 'vitest';
import { createEnvelope, parseEnvelope, serializeEnvelope } from './envelope.js';

const sampleEvent = {
  event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  timestamp: '2026-06-03T12:00:00.000Z',
  platform: 'javascript' as const,
  level: 'error' as const,
  sdk: { name: 'test', version: '0.1.0' },
};

describe('envelope', () => {
  it('round-trips line-based format', () => {
    const envelope = createEnvelope([sampleEvent], { name: 'test', version: '0.1.0' });
    const serialized = serializeEnvelope(envelope);
    const parsed = parseEnvelope(serialized);
    expect(parsed.items).toHaveLength(1);
    expect(JSON.parse(parsed.items[0]!.payload).event_id).toBe(sampleEvent.event_id);
  });
});
