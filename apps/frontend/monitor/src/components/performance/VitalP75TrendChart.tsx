import { useState } from 'react';
import type { VitalTrendResponse } from '@sentry-guardian/types';
import { TimeSeriesLineChart } from '../charts/TimeSeriesLineChart.js';
import { Button } from '../ui.js';
import {
  PRIMARY_VITALS,
  VITAL_THRESHOLDS,
  formatVitalValue,
} from '../../lib/performance-labels.js';

type Props = {
  data: VitalTrendResponse;
  /** Denser layout for side column. 侧栏紧凑布局。 */
  compact?: boolean;
  /** Borderless inline panel with metric tabs only. 无边框内联面板。 */
  inline?: boolean;
  heightClass?: string;
};

/**
 * P75 trend chart with per-vital tabs and threshold bands.
 * 带 Vital 切换与阈值色带的 P75 趋势图。
 */
export function VitalP75TrendChart({
  data,
  compact = false,
  inline = false,
  heightClass,
}: Props) {
  const available = PRIMARY_VITALS.filter((metric) =>
    data.series.some((s) => s.metric === metric && s.points.some((p) => p.count > 0)),
  );
  const [metric, setMetric] = useState<string>(available[0] ?? PRIMARY_VITALS[0]);

  if (available.length === 0) {
    return (
      <p className="py-2 text-center text-[10px] text-[var(--sg-text-muted)]">暂无 Vital 样本</p>
    );
  }

  const activeMetric = available.includes(metric as (typeof PRIMARY_VITALS)[number])
    ? metric
    : available[0]!;
  const activeSeries = data.series.find((s) => s.metric === activeMetric)!;
  const hasData = activeSeries.points.some((p) => p.count > 0);
  const plotHeight = heightClass ?? (inline ? 'h-[4.5rem]' : compact ? 'h-20' : 'h-24');

  const tabs = (
    <div className="flex shrink-0 gap-0.5">
      {available.map((m) => (
        <Button
          key={m}
          type="button"
          size="sm"
          variant={activeMetric === m ? 'primary' : 'default'}
          onClick={() => setMetric(m)}
        >
          {m}
        </Button>
      ))}
    </div>
  );

  const chart = hasData ? (
    <TimeSeriesLineChart
      title=""
      buckets={data.buckets}
      bucketMs={data.bucket_ms}
      points={activeSeries.points.map((p) => ({
        bucket: p.bucket,
        value: p.p75_value,
        count: p.count,
      }))}
      formatValue={(v) => formatVitalValue(activeMetric, v)}
      thresholds={VITAL_THRESHOLDS[activeMetric]}
      valueLabel="P75"
      heightClass={plotHeight}
      dense={inline || compact}
    />
  ) : (
    <p className="py-2 text-center text-[10px] text-[var(--sg-text-muted)]">该指标暂无样本</p>
  );

  if (inline) {
    return (
      <div>
        <div className="mb-0.5 flex justify-end">{tabs}</div>
        {chart}
      </div>
    );
  }

  const wrapClass = compact
    ? 'rounded border border-[var(--sg-border)] bg-[var(--sg-content-bg)] p-1'
    : 'rounded border border-[var(--sg-border)] bg-[var(--sg-content-bg)] p-1.5';

  return (
    <div className={wrapClass}>
      <div className="mb-0.5 flex flex-wrap items-center justify-between gap-1">
        <h3 className="text-[10px] font-semibold text-[var(--sg-text)]">Vital P75</h3>
        {tabs}
      </div>
      {chart}
    </div>
  );
}
