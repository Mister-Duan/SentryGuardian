import { useEffect, useState } from 'react';
import type { PerformanceSummaryResponse, TransactionListQuery } from '@sentry-guardian/types';
import { StackedErrorTypeTrendChart } from '../charts/StackedErrorTypeTrendChart.js';
import { BarBreakdownChart } from '../charts/BarBreakdownChart.js';
import { Button } from '../ui.js';
import { HttpDurationTrendChart } from './HttpDurationTrendChart.js';
import { VitalP75TrendChart } from './VitalP75TrendChart.js';
import {
  PRIMARY_VITALS,
  formatVitalValue,
  labelMetricKey,
  rateVital,
  vitalRatingColor,
  vitalRatingLabel,
} from '../../lib/performance-labels.js';
import { formatTimeRangeLabel, type IssueTimeRange } from '../../lib/issue-time-range.js';
import { useAuth } from '../../lib/auth.js';

type OverviewTab = 'volume' | 'vitals' | 'http' | 'breakdown';

type Props = {
  projectId: string;
  query: TransactionListQuery;
  timeRange: IssueTimeRange;
};

const PLOT_HEIGHT = 'h-[4.5rem]';

function InlineVital({
  metric,
  p75,
  count,
}: {
  metric: string;
  p75: number;
  count: number;
}) {
  if (count <= 0) {
    return (
      <span className="text-[10px] text-[var(--sg-text-muted)]">
        {metric} <span className="text-[var(--sg-text)]">—</span>
      </span>
    );
  }
  const rating = rateVital(metric, p75);
  const color = vitalRatingColor(rating);
  return (
    <span className="inline-flex items-baseline gap-1 text-[10px] text-[var(--sg-text-muted)]">
      <span className="font-medium text-[var(--sg-text)]">{metric}</span>
      <span className="tabular-nums text-[var(--sg-text)]">{formatVitalValue(metric, p75)}</span>
      {color && (
        <span className="text-[9px]" style={{ color }}>
          {vitalRatingLabel(rating)}
        </span>
      )}
      <span className="text-[9px]">({count})</span>
    </span>
  );
}

/**
 * Compact tabbed performance overview (one chart panel at a time).
 * 紧凑 Tab 式性能概览（同一时间仅展示一个图表面板）。
 */
export function PerformanceOverview({ projectId, query, timeRange }: Props) {
  const { api } = useAuth();
  const [summary, setSummary] = useState<PerformanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<OverviewTab>('volume');

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    void api
      .performanceSummary(projectId, query)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [api, projectId, query]);

  const hasMetricTrend =
    summary != null &&
    summary.metric_trends.series.some((s) => s.points.some((p) => p.count > 0));
  const hasVitalTrend =
    summary != null &&
    summary.vital_trends.series.some((s) => s.points.some((p) => p.count > 0));
  const hasBreakdown = summary != null && summary.by_metric.length > 0;
  const hasHttpTrend = summary != null && summary.http_duration_trend.some((b) => b.count > 0);
  const hasData = hasMetricTrend || hasVitalTrend || hasBreakdown || (summary?.vitals.length ?? 0) > 0;

  if (!loading && !hasData) {
    return (
      <div className="border-b border-[var(--sg-border)] px-3 py-1 text-center text-[10px] text-[var(--sg-text-muted)]">
        {formatTimeRangeLabel(timeRange)}内暂无性能数据
      </div>
    );
  }

  const vitalMap = new Map(summary?.vitals.map((v) => [v.metric, v]) ?? []);

  const tabs: { id: OverviewTab; label: string; enabled: boolean }[] = [
    { id: 'volume', label: '事务量', enabled: hasMetricTrend },
    { id: 'vitals', label: 'Vital P75', enabled: hasVitalTrend },
    { id: 'http', label: 'HTTP', enabled: hasHttpTrend },
    { id: 'breakdown', label: '分布', enabled: hasBreakdown },
  ];
  const activeTab = tabs.find((t) => t.id === tab && t.enabled)?.id
    ?? tabs.find((t) => t.enabled)?.id
    ?? 'volume';

  return (
    <div className="border-b border-[var(--sg-border)] px-3 py-1">
      <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <p className="shrink-0 text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
          {formatTimeRangeLabel(timeRange)}
          {loading && <span className="ml-1 font-normal normal-case opacity-70">…</span>}
        </p>
        <span className="hidden h-3 w-px bg-[var(--sg-border)] sm:inline-block" aria-hidden />
        {PRIMARY_VITALS.map((metric, i) => (
          <span key={metric} className="inline-flex items-center">
            {i > 0 && <span className="mr-2 text-[var(--sg-border)]">·</span>}
            <InlineVital
              metric={metric}
              p75={vitalMap.get(metric)?.p75_value ?? 0}
              count={vitalMap.get(metric)?.count ?? 0}
            />
          </span>
        ))}
        {summary && summary.slow_http_count > 0 && (
          <>
            <span className="text-[var(--sg-border)]">·</span>
            <span className="text-[10px] text-[var(--sg-text-muted)]">
              HTTP {summary.slow_http_count} / {summary.avg_http_duration_ms}ms
            </span>
          </>
        )}
      </div>

      <div className="mb-0.5 flex flex-wrap items-center gap-1">
        {tabs.map(
          (t) =>
            t.enabled && (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={activeTab === t.id ? 'primary' : 'default'}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </Button>
            ),
        )}
      </div>

      <div className="min-h-[5.5rem]">
        {activeTab === 'volume' && hasMetricTrend && summary && (
          <StackedErrorTypeTrendChart
            title=""
            data={summary.metric_trends}
            heightClass={PLOT_HEIGHT}
            labelFn={labelMetricKey}
            dense
          />
        )}
        {activeTab === 'vitals' && summary && hasVitalTrend && (
          <VitalP75TrendChart data={summary.vital_trends} inline heightClass={PLOT_HEIGHT} />
        )}
        {activeTab === 'http' && summary && hasHttpTrend && (
          <HttpDurationTrendChart
            buckets={summary.http_duration_trend}
            bucketMs={summary.metric_trends.bucket_ms}
            inline
            heightClass={PLOT_HEIGHT}
          />
        )}
        {activeTab === 'breakdown' && summary && hasBreakdown && (
          <BarBreakdownChart
            title=""
            items={summary.by_metric}
            labelFn={labelMetricKey}
            compact
            flat
            maxItems={8}
          />
        )}
      </div>
    </div>
  );
}
