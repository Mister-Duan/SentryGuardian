import type { ErrorBreakdownItem } from '@sentry-guardian/types';

type Props = {
  title: string;
  items: ErrorBreakdownItem[];
  emptyText?: string;
  labelFn?: (key: string) => string;
};

/**
 * Horizontal bar chart for error breakdown (no external chart lib).
 * 错误分布横向条形图（无外部图表库）。
 */
export function BarBreakdownChart({
  title,
  items,
  emptyText = '暂无数据',
  labelFn = (k) => k,
}: Props) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-[var(--sg-text)]">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--sg-text-muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.key} className="text-xs">
              <div className="mb-0.5 flex justify-between gap-2">
                <span className="truncate" title={item.key}>
                  {labelFn(item.key)}
                </span>
                <span className="shrink-0 tabular-nums text-[var(--sg-text-muted)]">
                  {item.count}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--sg-border)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (item.count / max) * 100)}%`,
                    background: 'var(--sg-accent)',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
