import type { DurationTrendBucket } from '@sentry-guardian/types';
import { TimeSeriesLineChart } from '../charts/TimeSeriesLineChart.js';

type Props = {
  buckets: DurationTrendBucket[];
  bucketMs: number;
  /** Denser layout for side column. 侧栏紧凑布局。 */
  compact?: boolean;
  /** Borderless inline panel. 无边框内联面板。 */
  inline?: boolean;
  heightClass?: string;
};

/**
 * HTTP average duration trend line chart.
 * HTTP 平均耗时趋势折线图。
 */
export function HttpDurationTrendChart({
  buckets,
  bucketMs,
  compact = false,
  inline = false,
  heightClass,
}: Props) {
  const bucketStarts = buckets.map((b) => b.bucket);
  const hasData = buckets.some((b) => b.count > 0);

  if (!hasData) {
    return null;
  }

  const plotHeight = heightClass ?? (inline ? 'h-[4.5rem]' : compact ? 'h-16' : 'h-24');
  const points = buckets.map((b) => ({
    bucket: b.bucket,
    value: b.avg_ms,
    count: b.count,
  }));

  const chart = (
    <TimeSeriesLineChart
      title={inline ? '' : compact ? 'HTTP 耗时' : 'HTTP 平均耗时趋势'}
      buckets={bucketStarts}
      bucketMs={bucketMs}
      points={points}
      formatValue={(v) => `${Math.round(v)} ms`}
      valueLabel="平均"
      heightClass={plotHeight}
      dense={inline || compact}
    />
  );

  if (inline) {
    return chart;
  }

  return (
    <div
      className={`rounded border border-[var(--sg-border)] bg-[var(--sg-content-bg)] ${compact ? 'p-1' : 'p-1.5'}`}
    >
      {chart}
    </div>
  );
}
