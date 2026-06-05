import { useParams } from 'react-router-dom';
import { IssueEventsPanel } from '../../components/IssueEventsPanel.js';

export function IssueDetailEventsTab() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <IssueEventsPanel issueId={id} />;
}
