import type { ErrorEvent } from '@sentry-guardian/types';
import { Card } from './ui.js';
import {
  displayStackFrames,
  formatBreadcrumbTime,
  formatExceptionTitle,
  formatFrameLocation,
} from '../lib/format-event.js';

/**
 * Readable breakdown of an `ErrorEvent` for the issue detail page.
 */
export function EventDetail({ event }: { event: ErrorEvent }) {
  const exceptions = event.exception?.values ?? [];

  return (
    <div className="space-y-3">
      {(event.environment || event.release || event.request?.url) && (
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
                {ex.stacktrace?.frames && ex.stacktrace.frames.length > 0 && (
                  <ol className="mt-1 space-y-0.5 font-mono text-[11px]">
                    {displayStackFrames(ex.stacktrace.frames).map((frame, frameIndex) => (
                      <li
                        key={frameIndex}
                        className={
                          frame.in_app
                            ? 'rounded border border-[var(--sg-border)] bg-[var(--sg-row-selected)] px-1.5 py-0.5'
                            : 'px-1.5 py-0.5 text-[var(--sg-text-muted)]'
                        }
                        style={frame.in_app ? { color: 'var(--sg-accent)' } : undefined}
                      >
                        {formatFrameLocation(frame)}
                        {frame.in_app && (
                          <span className="ml-1.5 text-[10px] uppercase text-[var(--sg-text-muted)]">
                            应用内
                          </span>
                        )}
                      </li>
                    ))}
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

      {event.breadcrumbs && event.breadcrumbs.length > 0 && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">面包屑</h2>
          <ul className="space-y-1 text-xs">
            {event.breadcrumbs.map((crumb, index) => (
              <li
                key={index}
                className="flex gap-2 border-b border-[var(--sg-border)] py-1 last:border-0"
              >
                <span className="shrink-0 text-[var(--sg-text-muted)]">
                  {formatBreadcrumbTime(crumb.timestamp)}
                </span>
                <span>
                  {[crumb.category, crumb.message].filter(Boolean).join(' · ') || crumb.type || '—'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
