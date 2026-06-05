import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PRIMARY_SIDEBAR_WIDTH, TOP_BAR_HEIGHT } from '../layout/constants.js';
import { PRIMARY_NAV } from '../layout/sentry-nav.js';
import { useAuth } from '../lib/auth.js';
import { IconHelp, IconLogout } from './icons.js';
import { UnsupportedNotice } from './UnsupportedNotice.js';

export function PrimarySidebar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [helpHint, setHelpHint] = useState(false);

  return (
    <nav
      aria-label="主导航"
      className="flex shrink-0 flex-col items-center border-r border-[var(--sg-border)] bg-[var(--sg-surface)]"
      style={{ width: PRIMARY_SIDEBAR_WIDTH }}
    >
      <header
        className="flex w-full flex-col items-center justify-center gap-0.5 border-b border-[var(--sg-border)] px-1"
        style={{ height: TOP_BAR_HEIGHT }}
        title="组织"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white"
          style={{ background: 'var(--sg-accent)' }}
        >
          SG
        </span>
        <span className="max-w-full truncate text-[9px] text-[var(--sg-text-muted)]">默认组织</span>
      </header>

      <ul className="flex w-full flex-1 flex-col items-center gap-0.5 py-1">
        {PRIMARY_NAV.map((item) => {
          const isActive = item.match(pathname);
          return (
            <li key={item.id} className="w-full px-1">
              <NavLink
                to={item.to}
                title={item.label}
                className={[
                  'relative flex flex-col items-center justify-center gap-0.5 rounded-md py-1 text-[10px] font-medium leading-tight transition-colors',
                  isActive
                    ? 'text-[var(--sg-accent)]'
                    : 'text-[var(--sg-text-muted)] hover:bg-[var(--sg-sidebar-hover-bg)] hover:text-[var(--sg-text)]',
                ].join(' ')}
                style={{ minHeight: 46 }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r"
                    style={{ background: 'var(--sg-accent)' }}
                  />
                )}
                <item.Icon className="h-4 w-4" />
                <span className="max-w-[64px] truncate">{item.shortLabel}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {helpHint && (
        <div className="mx-1 mb-1">
          <UnsupportedNotice feature="帮助 / 新功能" compact />
        </div>
      )}

      <footer className="w-full space-y-0.5 border-t border-[var(--sg-border)] p-1">
        <button
          type="button"
          title="帮助"
          onClick={() => setHelpHint(true)}
          className="flex w-full flex-col items-center justify-center gap-0.5 rounded-md py-1 text-[10px] text-[var(--sg-text-muted)] hover:bg-[var(--sg-sidebar-hover-bg)]"
          style={{ minHeight: 40 }}
        >
          <IconHelp className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="退出登录"
          onClick={logout}
          className="flex w-full flex-col items-center justify-center gap-0.5 rounded-md py-1 text-[10px] text-[var(--sg-text-muted)] hover:bg-[var(--sg-sidebar-hover-bg)]"
          style={{ minHeight: 40 }}
        >
          <IconLogout className="h-4 w-4" />
        </button>
      </footer>
    </nav>
  );
}
