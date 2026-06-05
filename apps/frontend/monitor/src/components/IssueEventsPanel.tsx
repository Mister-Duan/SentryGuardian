import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EventSummary, IssueEventListResponse } from '@sentry-guardian/types';
import { Card } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function IssueEventsPanel({ issueId }: { issueId: string }) {
  const { api } = useAuth();
  const [data, setData] = useState<IssueEventListResponse | null>(null);

  useEffect(() => {
    void api.listIssueEvents(issueId).then(setData);
  }, [api, issueId]);

  if (!data) {
    return <p className="text-zinc-500">加载事件…</p>;
  }

  return (
    <Card>
      <h2 className="mb-3 font-medium">事件历史 ({data.total})</h2>
      <ul className="space-y-2 text-sm">
        {data.items.map((ev: EventSummary) => (
          <li key={ev.id} className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{new Date(ev.timestamp).toLocaleString()}</span>
            <span>{ev.environment ?? '—'}</span>
            <span>{ev.release ?? '—'}</span>
            <span>{ev.user_id ?? '—'}</span>
            <Link to={`/events/${ev.id}`} className="text-sky-400 hover:underline">
              详情
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
