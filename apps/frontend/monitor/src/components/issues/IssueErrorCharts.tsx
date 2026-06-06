import { useEffect, useState } from 'react';
import type { IssueErrorBreakdownResponse } from '@sentry-guardian/types';
import { BarBreakdownChart } from '../charts/BarBreakdownChart.js';
import { StackedErrorTypeTrendChart } from '../charts/StackedErrorTypeTrendChart.js';
import { Card } from '../ui.js';
import { labelMechanism } from '../../lib/error-labels.js';
import { useAuth } from '../../lib/auth.js';

export function IssueErrorCharts({ issueId }: { issueId: string }) {
  const { api } = useAuth();
  const [data, setData] = useState<IssueErrorBreakdownResponse | null>(null);

  useEffect(() => {
    void api.issueErrorBreakdown(issueId).then(setData);
  }, [api, issueId]);

  if (!data) {
    return <p className="text-xs text-[var(--sg-text-muted)]">加载图表…</p>;
  }

  return (
    <Card className="!p-3 space-y-4">
      <StackedErrorTypeTrendChart
        title="近 24 小时 · 按异常类型（横轴时间 · 纵轴事件量）"
        data={data.type_trends}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <BarBreakdownChart title="异常类型汇总" items={data.by_type} />
        <BarBreakdownChart
          title="捕获来源汇总"
          items={data.by_mechanism}
          labelFn={labelMechanism}
        />
      </div>
    </Card>
  );
}
