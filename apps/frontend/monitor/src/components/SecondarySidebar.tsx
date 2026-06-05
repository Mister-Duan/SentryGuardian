import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEM_HEIGHT, SECONDARY_SIDEBAR_WIDTH, TOP_BAR_HEIGHT } from '../layout/constants.js';
import { getActivePrimaryNav, type NavBadge, type SecondaryNavItem } from '../layout/sentry-nav.js';

function NavBadgePill({ badge }: { badge: NavBadge }) {
  const label = badge === 'new' ? '新' : badge === 'beta' ? 'β' : 'α';
  return (
    <span className="ml-auto rounded bg-[var(--sg-content-bg)] px-1 text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
      {label}
    </span>
  );
}

function SecondaryLink({ item }: { item: SecondaryNavItem }) {
  const content = (isActive: boolean) => (
    <>
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r"
          style={{ background: 'var(--sg-accent)' }}
        />
      )}
      <span className={`truncate pl-1 ${!item.supported ? 'opacity-80' : ''}`}>{item.label}</span>
      {item.badge && <NavBadgePill badge={item.badge} />}
      {!item.supported && (
        <span className="ml-1 text-[10px] text-[var(--sg-text-muted)]" title="尚未实现">
          ·
        </span>
      )}
    </>
  );

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'relative flex items-center rounded-md px-2 text-xs font-medium transition-colors',
          isActive
            ? 'bg-[var(--sg-sidebar-active-bg)] text-[var(--sg-accent)]'
            : 'text-[var(--sg-text)] hover:bg-[var(--sg-sidebar-hover-bg)]',
        ].join(' ')
      }
      style={{ height: NAV_ITEM_HEIGHT }}
    >
      {({ isActive }) => content(isActive)}
    </NavLink>
  );
}

export function SecondarySidebar() {
  const { pathname } = useLocation();
  const active = getActivePrimaryNav(pathname);

  return (
    <aside
      aria-label="次级导航"
      className="flex shrink-0 flex-col border-r border-[var(--sg-border)] bg-[var(--sg-content-bg)]"
      style={{ width: SECONDARY_SIDEBAR_WIDTH }}
      data-secondary-navigation-sidebar
    >
      <header
        className="flex items-center border-b border-[var(--sg-border)] px-3"
        style={{ height: TOP_BAR_HEIGHT, minHeight: TOP_BAR_HEIGHT }}
      >
        <h2 className="truncate text-sm font-semibold text-[var(--sg-text)]">{active.label}</h2>
      </header>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {active.sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-3' : ''}>
            {section.title && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--sg-text-muted)]">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <SecondaryLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {pathname.match(/^\/issues\/[^/]+$/) && (
          <div className="mt-3">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--sg-text-muted)]">
              当前
            </p>
            <span
              className="flex items-center rounded-md px-2 text-xs text-[var(--sg-text-muted)]"
              style={{ height: NAV_ITEM_HEIGHT }}
            >
              问题详情
            </span>
          </div>
        )}
      </nav>
    </aside>
  );
}
