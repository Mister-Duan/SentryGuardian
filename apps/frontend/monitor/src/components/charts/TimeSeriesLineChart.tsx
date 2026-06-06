type Point = {
  bucket: string;
  value: number;
  count: number;
};

type Thresholds = {
  good: number;
  poor: number;
};

type Props = {
  title: string;
  buckets: string[];
  bucketMs: number;
  points: Point[];
  formatValue: (value: number) => string;
  thresholds?: Thresholds;
  valueLabel?: string;
  heightClass?: string;
  /** Denser axis and x labels. 更紧凑的轴与横轴标签。 */
  dense?: boolean;
};

function formatBucketLabel(iso: string, bucketMs: number): string {
  const d = new Date(iso);
  if (bucketMs < 24 * 60 * 60_000) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit' });
}

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
 * Line chart with optional good/poor threshold bands.
 * 带可选良好/较差阈值的折线图。
 */
export function TimeSeriesLineChart({
  title,
  buckets,
  bucketMs,
  points,
  formatValue,
  thresholds,
  valueLabel = '值',
  heightClass = 'h-28',
  dense = false,
}: Props) {
  const active = points.filter((p) => p.count > 0);
  if (buckets.length === 0 || active.length === 0) {
    return (
      <div>
        <h3 className="mb-1 text-[10px] font-semibold text-[var(--sg-text)]">{title}</h3>
        <p className="text-[10px] text-[var(--sg-text-muted)]">暂无数据</p>
      </div>
    );
  }

  const maxValue = Math.max(
    thresholds ? thresholds.poor * 1.15 : 0,
    ...active.map((p) => p.value),
    1,
  );
  const yTicks = [0, Math.round(maxValue / 2), Math.round(maxValue)];
  const labelIndices = labelTickIndices(buckets.length);
  const pointByBucket = new Map(points.map((p) => [p.bucket, p]));

  const lineCoords = buckets
    .map((bucket, i) => {
      const p = pointByBucket.get(bucket);
      if (!p || p.count <= 0) return null;
      const x = tickLeftPercent(i, buckets.length);
      const y = 100 - (p.value / maxValue) * 100;
      return { x, y, bucket, p };
    })
    .filter((c): c is NonNullable<typeof c> => c != null);

  const polyline = lineCoords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <div className="flex min-h-0 flex-col">
      {title ? (
        <h3 className="mb-0.5 text-[10px] font-semibold text-[var(--sg-text)]">{title}</h3>
      ) : null}

      <div className={`flex ${dense ? 'gap-1' : 'gap-1.5'}`}>
        <div
          className={`flex shrink-0 flex-col justify-between text-right tabular-nums text-[var(--sg-text-muted)] ${dense ? 'w-7 text-[8px]' : 'w-10 text-[9px]'} ${heightClass}`}
        >
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{formatValue(tick)}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`relative w-full border-b border-l border-[var(--sg-border)] ${heightClass}`}>
            {thresholds && (
              <>
                <div
                  className="pointer-events-none absolute left-0 right-0 bg-[#16a34a]/10"
                  style={{
                    bottom: 0,
                    height: `${(thresholds.good / maxValue) * 100}%`,
                  }}
                />
                <div
                  className="pointer-events-none absolute left-0 right-0 bg-[#ca8a04]/10"
                  style={{
                    bottom: `${(thresholds.good / maxValue) * 100}%`,
                    height: `${((thresholds.poor - thresholds.good) / maxValue) * 100}%`,
                  }}
                />
              </>
            )}

            {yTicks.slice(1, -1).map((tick) => (
              <div
                key={tick}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[var(--sg-border)] opacity-60"
                style={{ bottom: `${(tick / maxValue) * 100}%` }}
              />
            ))}

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

            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {polyline && (
                <polyline
                  fill="none"
                  stroke="var(--sg-accent)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  points={polyline}
                />
              )}
              {lineCoords.map(({ x, y, bucket, p }) => (
                <circle
                  key={bucket}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="var(--sg-accent)"
                  vectorEffect="non-scaling-stroke"
                >
                  <title>
                    {formatBucketLabel(bucket, bucketMs)} · {valueLabel} {formatValue(p.value)} ({p.count})
                  </title>
                </circle>
              ))}
            </svg>
          </div>

          <div className={`relative mt-0.5 w-full ${dense ? 'h-3' : 'h-4'}`}>
            {labelIndices.map((i) => {
              const bucket = buckets[i]!;
              return (
                <span
                  key={bucket}
                  className={`absolute top-0 whitespace-nowrap leading-none text-[var(--sg-text-muted)] ${dense ? 'text-[8px]' : 'text-[9px]'} ${labelAlign(i, buckets.length)}`}
                  style={{ left: `${tickLeftPercent(i, buckets.length)}%` }}
                >
                  {formatBucketLabel(bucket, bucketMs)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
