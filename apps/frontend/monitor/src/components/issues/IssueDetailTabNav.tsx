import { NavLink, useParams } from 'react-router-dom';
import { issueDetailTabs } from '../../layout/sentry-nav.js';

export function IssueDetailTabNav() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  const tabs = issueDetailTabs(id);

  return (
    <div className="mb-3 flex flex-wrap gap-1 border-b border-[var(--sg-border)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          end={tab.id === 'details'}
          className={({ isActive }) =>
            [
              'rounded-t px-2.5 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border border-b-0 border-[var(--sg-border)] bg-[var(--sg-surface)] text-[var(--sg-accent)]'
                : 'text-[var(--sg-text-muted)] hover:bg-[var(--sg-row-hover)]',
              !tab.supported ? 'italic' : '',
            ].join(' ')
          }
        >
          {tab.label}
          {!tab.supported && (
            <span className="ml-1 text-[10px] text-[var(--sg-text-muted)]">*</span>
          )}
        </NavLink>
      ))}
    </div>
  );
}
