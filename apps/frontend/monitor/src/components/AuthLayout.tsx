import type { ReactNode } from 'react';
import { PRIMARY_SIDEBAR_WIDTH } from '../layout/constants.js';

/**
 * Auth pages: compact brand strip + form (Sentry login proportions).
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside
        className="hidden shrink-0 flex-col justify-between bg-[#2f2936] p-6 text-white lg:flex"
        style={{ width: Math.max(PRIMARY_SIDEBAR_WIDTH * 3, 220) }}
      >
        <div>
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold"
            style={{ background: 'var(--sg-accent)' }}
          >
            SG
          </span>
          <h1 className="mt-6 text-2xl font-semibold leading-tight">SentryGuardian</h1>
          <p className="mt-2 max-w-xs text-sm text-[#9e8fae]">
            轻量级前端监控，自托管部署。
          </p>
        </div>
        <p className="text-[11px] text-[#9e8fae]">© SentryGuardian</p>
      </aside>
      <main className="flex flex-1 items-center justify-center bg-[var(--sg-content-bg)] p-4">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
