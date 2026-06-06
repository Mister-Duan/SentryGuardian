import { useEffect, useState } from 'react';
import type { ErrorBreakdownResponse, ErrorTypeTrendResponse, IssueStatsQuery } from '@sentry-guardian/types';
import { BarBreakdownChart } from '../charts/BarBreakdownChart.js';
import { StackedErrorTypeTrendChart } from '../charts/StackedErrorTypeTrendChart.js';
import { Button } from '../ui.js';
import { labelLevel, labelMechanism } from '../../lib/error-labels.js';
import { formatTimeRangeLabel, type IssueTimeRange } from '../../lib/issue-time-range.js';
import { useAuth } from '../../lib/auth.js';

type Dimension = 'type' | 'mechanism';

type Props = {
  projectId: string;
  statsQuery: IssueStatsQuery;
  timeRange: IssueTimeRange;
};

/**
 * Compact error overview between filters and issue table; respects active scope filters.
 * 筛选项与表格之间的紧凑错误概览；遵循当前筛选范围。
 */
export function ProjectErrorOverview({ projectId, statsQuery, timeRange }: Props) {
  const { api } = useAuth();
  const [dimension, setDimension] = useState<Dimension>('type');
  const [trends, setTrends] = useState<ErrorTypeTrendResponse | null>(null);
  const [breakdown, setBreakdown] = useState<ErrorBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    void Promise.all([
      api.errorTypeTrends(projectId, statsQuery, dimension),
      api.errorBreakdown(projectId, statsQuery),
    ])
      .then(([t, b]) => {
        setTrends(t);
        setBreakdown(b);
      })
      .finally(() => setLoading(false));
  }, [api, projectId, statsQuery, dimension]);

  const hasTrend =
    trends != null && trends.series.some((s) => s.points.some((p) => p.count > 0));
  const hasBreakdown =
    breakdown != null &&
    (breakdown.by_type.length > 0 ||
      breakdown.by_mechanism.length > 0 ||
      breakdown.by_level.length > 0);

  if (!loading && !hasTrend && !hasBreakdown) {
    return (
      <div className="border-b border-[var(--sg-border)] px-3 py-2 text-center text-xs text-[var(--sg-text-muted)]">
        {formatTimeRangeLabel(timeRange)}内暂无错误事件
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--sg-border)] px-3 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
        <p className="text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
          {formatTimeRangeLabel(timeRange)} · 错误概览
          {loading && <span className="ml-2 font-normal normal-case opacity-70">加载中…</span>}
        </p>
        {hasTrend && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={dimension === 'type' ? 'primary' : 'default'}
              onClick={() => setDimension('type')}
            >
              异常类型
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dimension === 'mechanism' ? 'primary' : 'default'}
              onClick={() => setDimension('mechanism')}
            >
              捕获来源
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-2 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          {hasTrend && trends ? (
            <StackedErrorTypeTrendChart
              title={dimension === 'type' ? '时间趋势 · 异常类型' : '时间趋势 · 捕获来源'}
              data={trends}
              heightClass="h-28"
              labelFn={dimension === 'mechanism' ? labelMechanism : undefined}
            />
          ) : (
            <p className="py-3 text-center text-[10px] text-[var(--sg-text-muted)]">暂无趋势数据</p>
          )}
        </div>

        <div className="grid gap-1.5 sm:grid-cols-3 lg:col-span-5">
          {hasBreakdown && breakdown ? (
            <>
              <BarBreakdownChart
                title="异常类型"
                items={breakdown.by_type}
                compact
                maxItems={6}
              />
              <BarBreakdownChart
                title="捕获来源"
                items={breakdown.by_mechanism}
                labelFn={labelMechanism}
                compact
                maxItems={6}
              />
              <BarBreakdownChart
                title="严重级别"
                items={breakdown.by_level}
                labelFn={labelLevel}
                compact
                maxItems={6}
              />
            </>
          ) : (
            <p className="col-span-3 py-3 text-center text-[10px] text-[var(--sg-text-muted)]">
              暂无分布数据
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
