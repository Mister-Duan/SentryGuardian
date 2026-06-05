import type { ReactNode } from 'react';
import { PageHeaderProvider } from '../layout/PageHeaderContext.js';
import { PrimarySidebar } from './PrimarySidebar.js';
import { SecondarySidebar } from './SecondarySidebar.js';
import { TopBar } from './TopBar.js';

/**
 * Sentry page-frame shell: primary (74px) + secondary (168px) + main with top bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageHeaderProvider>
      <div className="flex h-dvh overflow-hidden bg-[var(--sg-content-bg)]">
        <PrimarySidebar />
        <SecondarySidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--sg-surface)]">
          <TopBar />
          <main id="main" className="flex-1 overflow-y-auto focus:outline-none" tabIndex={-1}>
            <div className="px-4 py-3">{children}</div>
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
