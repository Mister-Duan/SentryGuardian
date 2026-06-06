import type { ErrorBreakdownItem } from '@sentry-guardian/types';

type Props = {
  title: string;
  items: ErrorBreakdownItem[];
  emptyText?: string;
  labelFn?: (key: string) => string;
  /** Denser rows for side-by-side layout. 并排布局时使用更紧凑行高。 */
  compact?: boolean;
  /** Max bars to render. 最多展示条数。 */
  maxItems?: number;
  /** No outer border/padding (tab panel). 无外边框（Tab 面板内）。 */
  flat?: boolean;
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
  compact = false,
  maxItems = 12,
  flat = false,
}: Props) {
  const shown = items.slice(0, maxItems);
  const max = Math.max(1, ...shown.map((i) => i.count));

  return (
    <div
      className={
        flat
          ? 'flex h-full min-h-0 flex-col'
          : `flex h-full min-h-0 flex-col rounded border border-[var(--sg-border)] bg-[var(--sg-content-bg)] ${compact ? 'p-1.5' : 'p-2'}`
      }
    >
      {title ? (
        <h3 className="mb-0.5 text-[10px] font-semibold text-[var(--sg-text)]">{title}</h3>
      ) : null}
      {shown.length === 0 ? (
        <p className="text-[10px] text-[var(--sg-text-muted)]">{emptyText}</p>
      ) : (
        <ul className={flat ? 'space-y-0.5' : compact ? 'space-y-1' : 'space-y-1.5'}>
          {shown.map((item) => (
            <li key={item.key} className={flat ? 'text-[9px]' : 'text-[10px]'}>
              <div className="mb-0.5 flex justify-between gap-1">
                <span className="truncate" title={item.key}>
                  {labelFn(item.key)}
                </span>
                <span className="shrink-0 tabular-nums text-[var(--sg-text-muted)]">
                  {item.count}
                </span>
              </div>
              <div
                className={`overflow-hidden rounded-full bg-[var(--sg-border)] ${compact ? 'h-1' : 'h-1.5'}`}
              >
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
