import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EventSummary, IssueEventListResponse } from '@sentry-guardian/types';
import { Card } from './ui.js';
import { useAuth } from '../lib/auth.js';

export function IssueEventsPanel({ issueId }: { issueId: string }) {
  const { api } = useAuth();
  const [data, setData] = useState<IssueEventListResponse | null>(null);

  useEffect(() => {
    void api.listIssueEvents(issueId).then(setData);
  }, [api, issueId]);

  if (!data) {
    return <p className="text-xs text-[var(--sg-text-muted)]">加载事件…</p>;
  }

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold">事件历史 ({data.total})</h2>
      <ul className="space-y-1 text-xs">
        {data.items.map((ev: EventSummary) => (
          <li
            key={ev.id}
            className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-[var(--sg-border)] py-1 last:border-0"
          >
            <span className="text-[var(--sg-text-muted)] tabular-nums">
              {new Date(ev.timestamp).toLocaleString()}
            </span>
            <span>{ev.environment ?? '—'}</span>
            <span className="truncate">{ev.release ?? '—'}</span>
            <Link
              to={`/events/${ev.id}`}
              className="font-medium hover:underline"
              style={{ color: 'var(--sg-accent)' }}
            >
              详情
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
