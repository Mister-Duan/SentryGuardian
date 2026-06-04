import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { IssueDetailResponse } from '@sentry-guardian/types';
import { Button, Card } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const [detail, setDetail] = useState<IssueDetailResponse | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    void api.getIssue(id).then(setDetail);
  }, [api, id]);

  if (!detail) {
    return <p className="p-6 text-zinc-500">加载中…</p>;
  }

  const { issue, latest_event: event } = detail;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <Link to="/issues" className="text-sm text-sky-400 hover:underline">
        ← 返回列表
      </Link>
      <Card>
        <h1 className="text-xl font-semibold">{issue.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {issue.status} · {issue.event_count} events · {issue.culprit ?? '—'}
        </p>
        <div className="mt-4 flex gap-2">
          {(['resolved', 'ignored', 'unresolved'] as const).map((status) => (
            <Button
              key={status}
              type="button"
              className="bg-zinc-800 text-zinc-100"
              onClick={() =>
                void api.updateIssueStatus(issue.id, { status }).then(() =>
                  api.getIssue(issue.id).then(setDetail),
                )
              }
            >
              {status}
            </Button>
          ))}
        </div>
      </Card>
      {event && (
        <Card>
          <h2 className="mb-2 font-medium">最近事件</h2>
          <pre className="overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300">
            {JSON.stringify(event, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
