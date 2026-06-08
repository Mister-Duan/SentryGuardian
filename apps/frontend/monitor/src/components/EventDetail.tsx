import { useMemo, useState } from 'react';
import type { ErrorEvent, StackFrame } from '@sentry-guardian/types';
import { Card } from './ui.js';
import { FrameOriginBadge } from './FrameOriginBadge.js';
import { StackFramePanel } from './StackFramePanel.js';
import {
  displayBreadcrumbs,
  displayStackFrames,
  formatBreadcrumbTime,
  formatExceptionTitle,
  formatFrameLocation,
} from '../lib/format-event.js';
import {
  labelErrorType,
  labelLevel,
  labelMechanism,
  LEVEL_LABELS,
} from '../lib/error-labels.js';

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    fatal: 'bg-red-100 text-red-800',
    error: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-800',
    info: 'bg-blue-50 text-blue-700',
    debug: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${colors[level] ?? 'bg-gray-100'}`}
    >
      {labelLevel(level)}
    </span>
  );
}

/**
 * Readable breakdown of an `ErrorEvent` for the issue detail page.
 * Issue 详情页可读的错误事件分解展示。
 */
export function EventDetail({ event }: { event: ErrorEvent }) {
  const exceptions = event.exception?.values ?? [];
  const primary = exceptions[0];
  const errorTypeTag = event.tags?.['error.type'];
  const browserExtra = event.extra?.browser as Record<string, unknown> | undefined;

  const defaultExpandedKey = useMemo(() => {
    const frames = primary?.stacktrace?.frames ?? [];
    const displayed = [...frames].reverse();
    const topInApp = displayed.findIndex((f) => f.in_app !== false);
    if (topInApp >= 0) {
      return `0:${topInApp}`;
    }
    return displayed.length > 0 ? '0:0' : null;
  }, [primary]);

  const [expandedKey, setExpandedKey] = useState<string | null>(defaultExpandedKey);

  function toggleFrame(exIndex: number, frameIndex: number, frame: StackFrame) {
    const key = `${exIndex}:${frameIndex}`;
    if (frame.in_app === false) {
      return;
    }
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-3">
      <Card className="!p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={event.level} />
          {errorTypeTag && (
            <span className="rounded bg-[var(--sg-border)] px-1.5 py-0.5 text-[10px] text-[var(--sg-text-muted)]">
              {labelErrorType(errorTypeTag)}
            </span>
          )}
          {primary?.mechanism && (
            <span className="text-[10px] text-[var(--sg-text-muted)]">
              来源：{labelMechanism(primary.mechanism.type)}
              {primary.mechanism.handled ? '（已处理）' : '（未处理）'}
            </span>
          )}
          <span className="text-[10px] tabular-nums text-[var(--sg-text-muted)]">
            {new Date(event.timestamp).toLocaleString()}
          </span>
        </div>
      </Card>

      {(event.environment ||
        event.release ||
        event.request?.url ||
        event.user ||
        (event.tags && Object.keys(event.tags).length > 0)) && (
        <Card>
          <h2 className="mb-1.5 text-sm font-semibold">上下文</h2>
          <dl className="grid gap-1.5 text-xs">
            {event.environment && (
              <div>
                <dt className="text-[var(--sg-text-muted)]">环境</dt>
                <dd>{event.environment}</dd>
              </div>
            )}
            {event.release && (
              <div>
                <dt className="text-[var(--sg-text-muted)]">版本</dt>
                <dd className="font-mono">{event.release}</dd>
              </div>
            )}
            {event.request?.url && (
              <div>
                <dt className="text-[var(--sg-text-muted)]">地址</dt>
                <dd className="break-all font-mono">{event.request.url}</dd>
              </div>
            )}
            {event.user && (
              <div>
                <dt className="text-[var(--sg-text-muted)]">用户</dt>
                <dd>
                  {[event.user.id, event.user.email, event.user.username]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </dd>
              </div>
            )}
            {event.tags && Object.keys(event.tags).length > 0 && (
              <div>
                <dt className="text-[var(--sg-text-muted)]">标签</dt>
                <dd className="flex flex-wrap gap-1">
                  {Object.entries(event.tags).map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded border border-[var(--sg-border)] px-1 py-0.5 font-mono text-[10px]"
                    >
                      {k}={v}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {browserExtra && (
        <Card>
          <h2 className="mb-1.5 text-sm font-semibold">浏览器</h2>
          <dl className="grid gap-1 text-xs text-[var(--sg-text-muted)]">
            {typeof browserExtra.user_agent === 'string' && (
              <div>
                <dt>User-Agent</dt>
                <dd className="break-all font-mono text-[var(--sg-text)]">
                  {browserExtra.user_agent}
                </dd>
              </div>
            )}
            {typeof browserExtra.language === 'string' && (
              <div>
                <dt>语言</dt>
                <dd>{browserExtra.language}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {exceptions.length > 0 && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">异常</h2>
          <div className="space-y-3">
            {exceptions.map((ex, index) => (
              <div key={`${ex.type}-${index}`}>
                <p className="font-mono text-xs text-[var(--sg-danger)]">
                  {formatExceptionTitle(ex)}
                </p>
                {ex.mechanism && index > 0 && (
                  <p className="mt-0.5 text-[10px] text-[var(--sg-text-muted)]">
                    {labelMechanism(ex.mechanism.type)}
                  </p>
                )}
                {ex.stacktrace?.frames && ex.stacktrace.frames.length > 0 && (
                  <ol className="mt-1 space-y-1 font-mono text-[11px]">
                    {displayStackFrames(ex.stacktrace.frames).map((frame, frameIndex) => {
                      const key = `${index}:${frameIndex}`;
                      const isExpanded = expandedKey === key;
                      const canExpand = frame.in_app !== false;
                      return (
                        <li key={frameIndex}>
                          <button
                            type="button"
                            disabled={!canExpand}
                            onClick={() => toggleFrame(index, frameIndex, frame)}
                            className={
                              frame.in_app
                                ? 'w-full rounded border border-[var(--sg-border)] bg-[var(--sg-row-selected)] px-1.5 py-0.5 text-left'
                                : 'w-full px-1.5 py-0.5 text-left text-[var(--sg-text-muted)]'
                            }
                            style={frame.in_app ? { color: 'var(--sg-accent)' } : undefined}
                          >
                            {formatFrameLocation(frame)}
                            <FrameOriginBadge inApp={frame.in_app} />
                          </button>
                          {isExpanded && canExpand && <StackFramePanel frame={frame} />}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {event.message && !exceptions.length && (
        <Card>
          <h2 className="mb-1.5 text-sm font-semibold">消息</h2>
          <p className="font-mono text-xs">{event.message}</p>
        </Card>
      )}

      {event.extra && Object.keys(event.extra).some((k) => k !== 'browser') && (
        <Card>
          <h2 className="mb-1.5 text-sm font-semibold">附加信息</h2>
          <dl className="space-y-1 text-xs">
            {Object.entries(event.extra)
              .filter(([k]) => k !== 'browser')
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[var(--sg-text-muted)]">{k}</dt>
                  <dd className="break-all font-mono">{JSON.stringify(v)}</dd>
                </div>
              ))}
          </dl>
        </Card>
      )}

      {event.breadcrumbs && event.breadcrumbs.length > 0 && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">面包屑</h2>
          <ul className="space-y-1 text-xs">
            {displayBreadcrumbs(event.breadcrumbs).map((crumb, index) => (
              <li
                key={index}
                className="flex gap-2 border-b border-[var(--sg-border)] py-1 last:border-0"
              >
                <span className="shrink-0 text-[var(--sg-text-muted)]">
                  {formatBreadcrumbTime(crumb.timestamp)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[var(--sg-text-muted)]">
                    {[crumb.category, crumb.level ? LEVEL_LABELS[crumb.level] ?? crumb.level : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {(crumb.message || crumb.type) && (
                    <span className="ml-1">
                      {crumb.message || crumb.type}
                    </span>
                  )}
                  {crumb.data && Object.keys(crumb.data).length > 0 && (
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-[var(--sg-text-muted)]">
                      {JSON.stringify(crumb.data)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
