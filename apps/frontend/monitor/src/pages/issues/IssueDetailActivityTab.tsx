import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { IssueCommentResponse } from '@sentry-guardian/types';
import { UnsupportedNotice } from '../../components/UnsupportedNotice.js';
import { Button, Card, Input } from '../../components/ui.js';
import { useAuth } from '../../lib/auth.js';
import type { IssueDetailOutletContext } from './issue-detail-context.js';

export function IssueDetailActivityTab() {
  const { detail } = useOutletContext<IssueDetailOutletContext>();
  const { api } = useAuth();
  const [comments, setComments] = useState<IssueCommentResponse[]>([]);
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    void api.listComments(detail.issue.id).then(setComments);
  }, [api, detail.issue.id]);

  return (
    <div className="space-y-3">
      <UnsupportedNotice feature="完整动态时间线（状态变更、分配）" compact />
      <Card>
        <h2 className="mb-2 text-sm font-semibold">评论</h2>
        <ul className="mb-2 space-y-1.5 text-xs">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-[var(--sg-border)] pb-1.5">
              <span className="text-[var(--sg-text-muted)]">{c.author_email}</span>
              <span className="mx-1.5">{new Date(c.created_at).toLocaleString()}</span>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void api.addComment(detail.issue.id, { body: commentBody }).then((c) => {
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
          <Button type="submit" variant="primary" size="sm">
            发送
          </Button>
        </form>
      </Card>
    </div>
  );
}
