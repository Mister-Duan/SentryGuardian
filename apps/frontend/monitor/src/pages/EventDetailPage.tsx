import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EventDetail } from '../components/EventDetail.js';
import { useAuth } from '../lib/auth.js';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useAuth();
  const [event, setEvent] = useState<Awaited<ReturnType<typeof api.getEvent>> | null>(null);

  useEffect(() => {
    if (id) {
      void api.getEvent(id).then(setEvent);
    }
  }, [api, id]);

  if (!event) {
    return <p className="p-6 text-zinc-500">加载中…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <Link to={`/issues/${event.issue_id ?? ''}`} className="text-sm text-sky-400 hover:underline">
        ← 返回 Issue
      </Link>
      <EventDetail event={event.payload} />
    </div>
  );
}
