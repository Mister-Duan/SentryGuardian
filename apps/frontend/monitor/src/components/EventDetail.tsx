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
 * Issue 详情页中 `ErrorEvent` 的可读化展示。
 */
export function EventDetail({ event }: { event: ErrorEvent }) {
  const exceptions = event.exception?.values ?? [];

  return (
    <div className="space-y-4">
      {(event.environment || event.release || event.request?.url) && (
        <Card>
          <h2 className="mb-2 font-medium">上下文</h2>
          <dl className="grid gap-2 text-sm text-zinc-300">
            {event.environment && (
              <div>
                <dt className="text-zinc-500">环境</dt>
                <dd>{event.environment}</dd>
              </div>
            )}
            {event.release && (
              <div>
                <dt className="text-zinc-500">Release</dt>
                <dd className="font-mono text-xs">{event.release}</dd>
              </div>
            )}
            {event.request?.url && (
              <div>
                <dt className="text-zinc-500">URL</dt>
                <dd className="break-all font-mono text-xs">{event.request.url}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {exceptions.length > 0 && (
        <Card>
          <h2 className="mb-3 font-medium">异常</h2>
          <div className="space-y-4">
            {exceptions.map((ex, index) => (
              <div key={`${ex.type}-${index}`}>
                <p className="font-mono text-sm text-red-300">{formatExceptionTitle(ex)}</p>
                {ex.stacktrace?.frames && ex.stacktrace.frames.length > 0 && (
                  <ol className="mt-2 space-y-1 font-mono text-xs">
                    {displayStackFrames(ex.stacktrace.frames).map((frame, frameIndex) => (
                      <li
                        key={frameIndex}
                        className={
                          frame.in_app
                            ? 'rounded bg-zinc-950 px-2 py-1 text-sky-300'
                            : 'px-2 py-1 text-zinc-500'
                        }
                      >
                        {formatFrameLocation(frame)}
                        {frame.in_app && (
                          <span className="ml-2 text-[10px] uppercase text-zinc-500">in app</span>
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
          <h2 className="mb-2 font-medium">消息</h2>
          <p className="font-mono text-sm text-zinc-300">{event.message}</p>
        </Card>
      )}

      {event.breadcrumbs && event.breadcrumbs.length > 0 && (
        <Card>
          <h2 className="mb-3 font-medium">面包屑</h2>
          <ul className="space-y-2 text-sm">
            {event.breadcrumbs.map((crumb, index) => (
              <li
                key={index}
                className="flex gap-3 border-b border-zinc-800 pb-2 last:border-0 last:pb-0"
              >
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatBreadcrumbTime(crumb.timestamp)}
                </span>
                <span className="text-zinc-400">
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
