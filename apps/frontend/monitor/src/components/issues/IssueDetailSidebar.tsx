import type { Issue } from '@sentry-guardian/types';
import { Card } from '../ui.js';
import { UnsupportedNotice } from '../UnsupportedNotice.js';
import { ISSUE_STATUS_LABELS } from '../../lib/format-event.js';

export function IssueDetailSidebar({ issue }: { issue: Issue }) {
  return (
    <aside className="hidden w-56 shrink-0 space-y-2 lg:block">
      <Card className="!p-2.5">
        <h3 className="mb-2 text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
          问题信息
        </h3>
        <dl className="space-y-1.5 text-xs">
          <div>
            <dt className="text-[var(--sg-text-muted)]">状态</dt>
            <dd>{ISSUE_STATUS_LABELS[issue.status]}</dd>
          </div>
          <div>
            <dt className="text-[var(--sg-text-muted)]">事件数</dt>
            <dd className="tabular-nums">{issue.event_count}</dd>
          </div>
          <div>
            <dt className="text-[var(--sg-text-muted)]">首次出现</dt>
            <dd className="text-[11px]">{new Date(issue.first_seen).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-[var(--sg-text-muted)]">最近出现</dt>
            <dd className="text-[11px]">{new Date(issue.last_seen).toLocaleString()}</dd>
          </div>
        </dl>
      </Card>

      <Card className="!p-2.5">
        <h3 className="mb-1 text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
          人员
        </h3>
        <UnsupportedNotice feature="处理人 / 影响用户" compact />
      </Card>

      <Card className="!p-2.5">
        <h3 className="mb-1 text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
          相似 / 已合并
        </h3>
        <UnsupportedNotice feature="相似问题与已合并问题" compact />
      </Card>
    </aside>
  );
}
