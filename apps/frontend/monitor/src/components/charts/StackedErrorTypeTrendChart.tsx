import type { ErrorTypeTrendResponse } from '@sentry-guardian/types';

const SERIES_COLORS = [
  '#6c5ce7',
  '#00b894',
  '#e17055',
  '#0984e3',
  '#fdcb6e',
  '#e84393',
  '#636e72',
  '#00cec9',
  '#a29bfe',
];

type Props = {
  title: string;
  data: ErrorTypeTrendResponse;
  labelFn?: (key: string) => string;
};

function countAt(series: ErrorTypeTrendResponse['series'][0], bucket: string): number {
  return series.points.find((p) => p.bucket === bucket)?.count ?? 0;
}

function formatBucketLabel(iso: string, hours: number): string {
  const d = new Date(iso);
  if (hours <= 24) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit' });
}

/**
 * Stacked column chart: X = time buckets, Y = event count by error type.
 * 堆叠柱状图：横轴时间、纵轴各错误类型事件量。
 */
export function StackedErrorTypeTrendChart({ title, data, labelFn = (k) => k }: Props) {
  const { buckets, series } = data;
  const activeSeries = series.filter((s) => s.points.some((p) => p.count > 0));
  const displayLabel = (key: string) => (key === '__other__' ? '其他' : labelFn(key));

  if (buckets.length === 0 || activeSeries.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-xs font-semibold text-[var(--sg-text)]">{title}</h3>
        <p className="text-xs text-[var(--sg-text-muted)]">暂无数据</p>
      </div>
    );
  }

  const columnTotals = buckets.map((bucket) =>
    activeSeries.reduce((sum, s) => sum + countAt(s, bucket), 0),
  );
  const maxTotal = Math.max(1, ...columnTotals);

  const yTicks = [0, Math.ceil(maxTotal / 2), maxTotal];

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-[var(--sg-text)]">{title}</h3>

      <div className="flex gap-2">
        <div className="flex h-44 w-8 shrink-0 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-[var(--sg-text-muted)]">
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-44 border-b border-l border-[var(--sg-border)]">
            {yTicks.slice(1, -1).map((tick) => (
              <div
                key={tick}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[var(--sg-border)] opacity-60"
                style={{ bottom: `${(tick / maxTotal) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex items-end gap-0.5 px-0.5">
              {buckets.map((bucket, bi) => {
                const total = columnTotals[bi] ?? 0;
                const columnHeight = total > 0 ? (total / maxTotal) * 100 : 0;
                return (
                  <div
                    key={bucket}
                    className="flex min-w-[6px] flex-1 flex-col justify-end"
                    style={{ height: '100%' }}
                    title={`${formatBucketLabel(bucket, data.hours)}：共 ${total} 条`}
                  >
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t-sm"
                      style={{ height: `${columnHeight}%`, minHeight: total > 0 ? '2px' : 0 }}
                    >
                      {activeSeries.map((s, si) => {
                        const c = countAt(s, bucket);
                        if (c <= 0 || total <= 0) return null;
                        const segHeight = (c / total) * 100;
                        return (
                          <div
                            key={s.key}
                            style={{
                              height: `${segHeight}%`,
                              background: SERIES_COLORS[si % SERIES_COLORS.length],
                              minHeight: '1px',
                            }}
                            title={`${displayLabel(s.key)}：${c}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-1 flex gap-0.5 overflow-hidden">
            {buckets.map((bucket, i) => {
              const show =
                buckets.length <= 12 || i % Math.ceil(buckets.length / 8) === 0 || i === buckets.length - 1;
              return (
                <div key={bucket} className="min-w-[6px] flex-1 text-center">
                  {show && (
                    <span className="text-[9px] text-[var(--sg-text-muted)]">
                      {formatBucketLabel(bucket, data.hours)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {activeSeries.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1 text-[10px] text-[var(--sg-text)]">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {displayLabel(s.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
