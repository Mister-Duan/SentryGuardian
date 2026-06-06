import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { EventDetail } from '../../components/EventDetail.js';
import { IssueErrorCharts } from '../../components/issues/IssueErrorCharts.js';
import { IssueEventsPanel } from '../../components/IssueEventsPanel.js';
import { Card } from '../../components/ui.js';
import type { IssueDetailOutletContext } from './issue-detail-context.js';

export function IssueDetailDetailsTab() {
  const { detail } = useOutletContext<IssueDetailOutletContext>();
  const { issue, latest_event: event } = detail;
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-3">
      {issue.id && <IssueErrorCharts issueId={issue.id} />}
      {issue.id && <IssueEventsPanel issueId={issue.id} />}
      {event && <EventDetail event={event} />}
      {event && (
        <Card>
          <button
            type="button"
            className="text-xs text-[var(--sg-text-muted)]"
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? '隐藏' : '显示'}原始 JSON
          </button>
          {showRaw && (
            <pre className="mt-2 max-h-64 overflow-auto rounded border border-[var(--sg-border)] bg-[var(--sg-content-bg)] p-2 font-mono text-[11px]">
              {JSON.stringify(event, null, 2)}
            </pre>
          )}
        </Card>
      )}
    </div>
  );
}
