/**
 * Inline notice for Sentry-parity UI not yet implemented.
 * 尚未实现的 Sentry 对标能力提示。
 */
export function UnsupportedNotice({
  feature,
  compact = false,
}: {
  feature: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900'
          : 'rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'
      }
      role="status"
    >
      <strong className="font-medium">{feature}</strong>
      <span className={compact ? ' ml-1' : ' block mt-0.5 text-xs'}>
        暂未支持 — SentryGuardian Lite 后续版本提供
      </span>
    </div>
  );
}
