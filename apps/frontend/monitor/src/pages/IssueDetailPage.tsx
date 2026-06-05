import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { IssueCommentResponse, IssueDetailResponse } from '@sentry-guardian/types';
import { EventDetail } from '../components/EventDetail.js';
import { IssueEventsPanel } from '../components/IssueEventsPanel.js';
import { Button, Card, Input } from '../components/ui.js';
import { ISSUE_STATUS_LABELS } from '../lib/format-event.js';
import { useAuth } from '../lib/auth.js';

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const [detail, setDetail] = useState<IssueDetailResponse | null>(null);
  const [comments, setComments] = useState<IssueCommentResponse[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api.getIssue(id).then(setDetail);
    void api.listComments(id).then(setComments);
  }, [api, id]);

  if (!detail) {
    return <p className="text-zinc-500">加载中…</p>;
  }

  const { issue, latest_event: event } = detail;

  return (
    <div className="space-y-4">
      <Link to="/issues" className="text-sm text-sky-400 hover:underline">
        ← 返回列表
      </Link>
      <Card>
        <h1 className="text-xl font-semibold">{issue.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {ISSUE_STATUS_LABELS[issue.status]} · {issue.event_count} 次 · {issue.culprit ?? '—'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['resolved', 'ignored', 'unresolved'] as const).map((status) => (
            <Button
              key={status}
              type="button"
              className={issue.status === status ? 'bg-sky-700 text-white' : 'bg-zinc-800 text-zinc-100'}
              onClick={() =>
                void api.updateIssueStatus(issue.id, { status }).then(() =>
                  api.getIssue(issue.id).then(setDetail),
                )
              }
            >
              {ISSUE_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      </Card>

      {id && <IssueEventsPanel issueId={id} />}

      {event && <EventDetail event={event} />}
      {event && (
        <Card>
          <button
            type="button"
            className="text-sm text-zinc-400 hover:text-zinc-200"
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? '隐藏' : '显示'}原始 JSON
          </button>
          {showRaw && (
            <pre className="mt-2 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300">
              {JSON.stringify(event, null, 2)}
            </pre>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-medium">评论</h2>
        <ul className="mb-4 space-y-2 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">{c.author_email}</span>
              <span className="mx-2 text-zinc-600">{new Date(c.created_at).toLocaleString()}</span>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void api.addComment(issue.id, { body: commentBody }).then((c) => {
              setComments((prev) => [...prev, c]);
              setCommentBody('');
            });
          }}
        >
          <Input
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="添加评论…"
          />
          <Button type="submit">发送</Button>
        </form>
      </Card>
    </div>
  );
}
