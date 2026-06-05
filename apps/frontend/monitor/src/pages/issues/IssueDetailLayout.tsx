import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import type { IssueDetailResponse } from '@sentry-guardian/types';
import { IssueDetailSidebar } from '../../components/issues/IssueDetailSidebar.js';
import { IssueDetailTabNav } from '../../components/issues/IssueDetailTabNav.js';
import { Button } from '../../components/ui.js';
import { usePageHeader } from '../../layout/PageHeaderContext.js';
import { ISSUE_STATUS_LABELS } from '../../lib/format-event.js';
import { useAuth } from '../../lib/auth.js';

export function IssueDetailLayout() {
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const [detail, setDetail] = useState<IssueDetailResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    void api.getIssue(id).then(setDetail);
  }, [api, id]);

  const issue = detail?.issue;

  const headerActions = useMemo(() => {
    if (!issue) return undefined;
    return (
      <div className="flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="primary" disabled title="尚未实现">
          解决
        </Button>
        <Button type="button" size="sm" variant="default" disabled title="尚未实现">
          归档
        </Button>
        <Button type="button" size="sm" variant="default" disabled title="尚未实现">
          处理人
        </Button>
        {(['resolved', 'ignored', 'unresolved'] as const).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={issue.status === status ? 'primary' : 'default'}
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
    );
  }, [api, issue]);

  usePageHeader({
    title: issue?.title ?? '问题详情',
    description: issue ? `ID ${issue.id.slice(0, 12)}…` : undefined,
    actions: headerActions,
  });

  if (!detail?.issue) {
    return <p className="text-xs text-[var(--sg-text-muted)]">加载中…</p>;
  }

  return (
    <div>
      <Link
        to="/issues"
        className="mb-2 inline-block text-xs hover:underline"
        style={{ color: 'var(--sg-accent)' }}
      >
        ← 返回问题列表
      </Link>
      <IssueDetailTabNav />
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <Outlet context={{ detail, setDetail }} />
        </div>
        <IssueDetailSidebar issue={detail.issue} />
      </div>
    </div>
  );
}
