import { labelFrameOrigin } from '../lib/error-labels.js';

/**
 * Badge for stack frame or culprit origin (In App vs Library).
 * 栈帧或 culprit 来源徽章（应用内 vs 三方库）。
 */
export function FrameOriginBadge({ inApp }: { inApp?: boolean }) {
  const label = labelFrameOrigin(inApp);
  if (!label) {
    return null;
  }
  const isInApp = inApp === true;
  return (
    <span
      className={
        isInApp
          ? 'ml-1.5 rounded border border-[var(--sg-border)] bg-[var(--sg-row-selected)] px-1 py-px text-[10px] uppercase'
          : 'ml-1.5 rounded border border-[var(--sg-border)] px-1 py-px text-[10px] uppercase text-[var(--sg-text-muted)]'
      }
      style={isInApp ? { color: 'var(--sg-accent)' } : undefined}
    >
      {label}
    </span>
  );
}
