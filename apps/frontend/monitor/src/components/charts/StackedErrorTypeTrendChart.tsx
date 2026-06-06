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

/** Max bar width (px); columns share plot width evenly. 柱体最大宽度；列均分绘图区宽度。 */
const MAX_BAR_WIDTH_PX = 8;

type Props = {
  title: string;
  data: ErrorTypeTrendResponse;
  labelFn?: (key: string) => string;
  /** Tailwind height class for plot area. 绘图区 Tailwind 高度类。 */
  heightClass?: string;
  /** Denser axis, labels, and legend. 更紧凑的轴、标签与图例。 */
  dense?: boolean;
};

function countAt(series: ErrorTypeTrendResponse['series'][0], bucket: string): number {
  return series.points.find((p) => p.bucket === bucket)?.count ?? 0;
}

function formatBucketLabel(iso: string, bucketMs: number): string {
  const d = new Date(iso);
  if (bucketMs < 24 * 60 * 60_000) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit' });
}

/** Pick label indices (always include first & last). 选取刻度标签索引（含首尾）。 */
function labelTickIndices(bucketCount: number, maxLabels = 8): number[] {
  if (bucketCount <= 0) return [];
  if (bucketCount <= maxLabels) {
    return Array.from({ length: bucketCount }, (_, i) => i);
  }
  const stride = Math.ceil((bucketCount - 1) / (maxLabels - 1));
  const indices: number[] = [0];
  for (let i = stride; i < bucketCount - 1; i += stride) {
    indices.push(i);
  }
  if (indices[indices.length - 1] !== bucketCount - 1) {
    indices.push(bucketCount - 1);
  }
  return indices;
}

function tickLeftPercent(index: number, total: number): number {
  return ((index + 0.5) / total) * 100;
}

function labelAlign(index: number, total: number): string {
  if (index === 0) return 'translate-x-0 text-left';
  if (index === total - 1) return '-translate-x-full text-right';
  return '-translate-x-1/2 text-center';
}

/**
 * Stacked column chart: X = time buckets, Y = event count by error type.
 * 堆叠柱状图：横轴时间、纵轴各错误类型事件量。
 */
export function StackedErrorTypeTrendChart({
  title,
  data,
  labelFn = (k) => k,
  heightClass = 'h-28',
  dense = false,
}: Props) {
  const { buckets, series } = data;
  const activeSeries = series.filter((s) => s.points.some((p) => p.count > 0));
  const displayLabel = (key: string) => (key === '__other__' ? '其他' : labelFn(key));

  if (buckets.length === 0 || activeSeries.length === 0) {
    return (
      <div>
        <h3 className="mb-1 text-[10px] font-semibold text-[var(--sg-text)]">{title}</h3>
        <p className="text-[10px] text-[var(--sg-text-muted)]">暂无数据</p>
      </div>
    );
  }

  const columnTotals = buckets.map((bucket) =>
    activeSeries.reduce((sum, s) => sum + countAt(s, bucket), 0),
  );
  const maxTotal = Math.max(1, ...columnTotals);
  const yTicks = [0, Math.ceil(maxTotal / 2), maxTotal];
  const labelIndices = labelTickIndices(buckets.length);

  return (
    <div className="flex min-h-0 flex-col">
      {title ? (
        <h3 className="mb-0.5 text-[10px] font-semibold text-[var(--sg-text)]">{title}</h3>
      ) : null}

      <div className={`flex ${dense ? 'gap-1' : 'gap-1.5'}`}>
        <div
          className={`flex shrink-0 flex-col justify-between text-right tabular-nums text-[var(--sg-text-muted)] ${dense ? 'w-5 text-[8px]' : 'w-6 text-[9px]'} ${heightClass}`}
        >
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`relative w-full border-b border-l border-[var(--sg-border)] ${heightClass}`}>
            {yTicks.slice(1, -1).map((tick) => (
              <div
                key={tick}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[var(--sg-border)] opacity-60"
                style={{ bottom: `${(tick / maxTotal) * 100}%` }}
              />
            ))}

            {/* X-axis minor ticks across full plot width / 铺满横轴的刻度线 */}
            {buckets.map((bucket, i) => (
              <div
                key={`tick-${bucket}`}
                className="pointer-events-none absolute bottom-0 w-px bg-[var(--sg-border)]"
                style={{
                  left: `${tickLeftPercent(i, buckets.length)}%`,
                  height: 4,
                  transform: 'translateX(-50%)',
                }}
              />
            ))}

            <div className="absolute inset-0 flex items-end">
              {buckets.map((bucket, bi) => {
                const total = columnTotals[bi] ?? 0;
                const columnHeight = total > 0 ? (total / maxTotal) * 100 : 0;
                return (
                  <div
                    key={bucket}
                    className="flex h-full flex-1 items-end justify-center"
                    title={`${formatBucketLabel(bucket, data.bucket_ms)}：共 ${total} 条`}
                  >
                    <div
                      className="flex flex-col justify-end overflow-hidden rounded-t-[1px]"
                      style={{
                        width: `min(${MAX_BAR_WIDTH_PX}px, 80%)`,
                        height: `${columnHeight}%`,
                        minHeight: total > 0 ? '1px' : 0,
                      }}
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

          {/* X-axis labels aligned to tick positions / 与刻度对齐的 X 轴标签 */}
          <div className={`relative mt-0.5 w-full ${dense ? 'h-3' : 'h-4'}`}>
            {labelIndices.map((i) => {
              const bucket = buckets[i]!;
              return (
                <span
                  key={bucket}
                  className={`absolute top-0 whitespace-nowrap leading-none text-[var(--sg-text-muted)] ${dense ? 'text-[8px]' : 'text-[9px]'} ${labelAlign(i, buckets.length)}`}
                  style={{ left: `${tickLeftPercent(i, buckets.length)}%` }}
                >
                  {formatBucketLabel(bucket, data.bucket_ms)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <ul
        className={`mt-0.5 flex flex-wrap overflow-hidden ${dense ? 'max-h-3 gap-x-1.5 text-[8px]' : 'max-h-4 gap-x-2 text-[9px]'} gap-y-0`}
      >
        {activeSeries.map((s, i) => (
          <li key={s.key} className="flex items-center gap-0.5 text-[var(--sg-text)]">
            <span
              className={`inline-block rounded-sm ${dense ? 'h-1 w-1' : 'h-1.5 w-1.5'}`}
              style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {displayLabel(s.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
