import { useLocation } from 'react-router-dom';
import { UnsupportedNotice } from '../../components/UnsupportedNotice.js';
import { issueDetailTabs } from '../../layout/sentry-nav.js';
import { useParams } from 'react-router-dom';

export function IssueDetailStubTab() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const tabs = id ? issueDetailTabs(id) : [];
  const tab = tabs.find((t) => pathname === t.path || pathname.startsWith(`${t.path}/`));

  return (
    <UnsupportedNotice feature={tab?.label ?? '此标签页'} />
  );
}
