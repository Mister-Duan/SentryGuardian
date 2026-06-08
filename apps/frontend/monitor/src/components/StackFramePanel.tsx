import type { StackFrame } from '@sentry-guardian/types';
import { formatFrameLocation } from '../lib/format-event.js';
import { FrameOriginBadge } from './FrameOriginBadge.js';

function SymbolicationBadge({ frame }: { frame: StackFrame }) {
  if (frame.symbolicated) {
    return (
      <span className="rounded border border-[var(--sg-border)] px-1 py-px text-[10px] uppercase text-[var(--sg-accent)]">
        已符号化
      </span>
    );
  }
  if (frame.map_matched === false) {
    return (
      <span className="rounded border border-[var(--sg-border)] px-1 py-px text-[10px] uppercase text-[var(--sg-text-muted)]">
        未找到 Source Map
      </span>
    );
  }
  return null;
}

/**
 * Expanded stack frame with source context for issue debugging.
 * Issue 排障用的栈帧展开与源码上下文。
 */
export function StackFramePanel({ frame }: { frame: StackFrame }) {
  return (
    <div className="mt-1 space-y-1.5 rounded border border-[var(--sg-border)] bg-[var(--sg-content-bg)] p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <SymbolicationBadge frame={frame} />
        <FrameOriginBadge inApp={frame.in_app} />
      </div>
      {frame.raw?.filename && (
        <p className="font-mono text-[10px] text-[var(--sg-text-muted)]">
          压缩位置：{formatFrameLocation(frame.raw)}
        </p>
      )}
      <p className="font-mono text-[11px]" style={{ color: 'var(--sg-accent)' }}>
        {formatFrameLocation(frame)}
      </p>
      {frame.context && frame.context.length > 0 ? (
        <pre className="overflow-x-auto rounded border border-[var(--sg-border)] bg-[var(--sg-row-selected)] p-2 font-mono text-[11px] leading-relaxed">
          {frame.context.map((line) => (
            <div
              key={line.line_no}
              className={
                line.is_error_line
                  ? 'bg-[var(--sg-danger)]/10 text-[var(--sg-danger)]'
                  : 'text-[var(--sg-text-muted)]'
              }
            >
              <span className="mr-2 inline-block w-8 select-none text-right tabular-nums opacity-60">
                {line.line_no}
              </span>
              {line.content || ' '}
            </div>
          ))}
        </pre>
      ) : (
        <p className="text-[10px] text-[var(--sg-text-muted)]">
          无源码片段。请上传含 sourcesContent 的 Source Map，或单独上传源文件 artifact。
        </p>
      )}
    </div>
  );
}
