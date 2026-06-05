import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EventDetail } from '../components/EventDetail.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import { useAuth } from '../lib/auth.js';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const [event, setEvent] = useState<Awaited<ReturnType<typeof api.getEvent>> | null>(null);

  usePageHeader({ title: '事件详情', description: id?.slice(0, 12) });

  useEffect(() => {
    if (id) {
      void api.getEvent(id).then(setEvent);
    }
  }, [api, id]);

  if (!event) {
    return <p className="text-xs text-[var(--sg-text-muted)]">加载中…</p>;
  }

  return (
    <div className="space-y-3">
      <Link
        to={`/issues/${event.issue_id ?? ''}`}
        className="inline-block text-xs hover:underline"
        style={{ color: 'var(--sg-accent)' }}
      >
        ← 返回问题
      </Link>
      <EventDetail event={event.payload} />
    </div>
  );
}
