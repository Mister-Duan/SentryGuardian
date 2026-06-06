import type { TrendBucket } from '@sentry-guardian/types';

type Props = {
  title: string;
  buckets: TrendBucket[];
  emptyText?: string;
};

/**
 * Vertical volume strip chart (sparkline-style).
 * 事件量竖条图（迷你趋势）。
 */
export function VolumeBarChart({ title, buckets, emptyText = '暂无数据' }: Props) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-[var(--sg-text)]">{title}</h3>
      {buckets.length === 0 ? (
        <p className="text-xs text-[var(--sg-text-muted)]">{emptyText}</p>
      ) : (
        <div className="flex h-16 items-end gap-0.5">
          {buckets.map((b) => (
            <div
              key={b.bucket}
              className="min-w-[3px] flex-1 rounded-t-sm"
              style={{
                height: `${Math.max(8, (b.count / max) * 100)}%`,
                background: 'var(--sg-accent)',
                opacity: 0.85,
              }}
              title={`${new Date(b.bucket).toLocaleString()}: ${b.count}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
