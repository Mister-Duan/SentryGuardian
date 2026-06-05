import { usePageHeaderContext } from '../layout/PageHeaderContext.js';
import { TOP_BAR_HEIGHT } from '../layout/constants.js';

/**
 * Sticky page header bar (Sentry page-frame, 53px).
 * 粘性页头（Sentry page-frame，53px）。
 */
export function TopBar() {
  const { header } = usePageHeaderContext();

  return (
    <header
      className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[var(--sg-border)] bg-[var(--sg-content-bg)] px-4"
      style={{ height: TOP_BAR_HEIGHT, minHeight: TOP_BAR_HEIGHT }}
    >
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-[var(--sg-text)]">
          {header?.title ?? 'SentryGuardian'}
        </h1>
        {header?.description && (
          <p className="truncate text-xs text-[var(--sg-text-muted)]">{header.description}</p>
        )}
      </div>
      {header?.actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{header.actions}</div>
      )}
    </header>
  );
}
