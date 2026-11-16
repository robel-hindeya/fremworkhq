import type { Metadata } from 'next';
import { EventsScreen } from '@/components/screens/EventsScreen';
import { type PublicEvent, type PublicSettings } from '@/lib/api';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: 'Events & Vibe Coding Training',
  description:
    'Join Fremwork live events, interactive workshops, and the 3-Day Vibe Coding Training. Learn to build and automate finance workflows with AI.',
  openGraph: {
    title: 'Events & Vibe Coding Training · Fremwork',
    description:
      'Join Fremwork live events, interactive workshops, and the 3-Day Vibe Coding Training. Learn to build and automate finance workflows with AI.',
    url: 'https://www.fremwork.com/events',
  },
};
export const revalidate = 60;

const DEFAULT_EVENTS: PublicEvent[] = [
  { id: '1', type: 'WEBINAR', title: 'Live demo: ask your numbers anything', description: 'Watch Fremwork answer real finance questions, from cash runway to overdue invoices. Bring your own.', length: '45 min', whenLabel: 'Nov 20 · 2:00 PM', startsAt: '2026-11-20T14:00:00Z', location: 'Online', capacity: 200 },
  { id: '2', type: 'WORKSHOP', title: 'Close the month faster', description: 'A hands-on session for controllers and accountants on reconciling, accruals and the month-end checklist.', length: '60 min', whenLabel: 'Nov 25 · 10:00 AM', startsAt: '2026-11-25T10:00:00Z', location: 'Online', capacity: 60 },
  { id: '3', type: 'MEETUP', title: 'Finance teams breakfast', description: 'Coffee and honest talk about budgets, tools and what keeps finance leads up at night.', length: '90 min', whenLabel: 'Dec 02 · 9:00 AM', startsAt: '2026-12-02T09:00:00Z', location: 'In person · Addis Ababa', capacity: 30 },
  { id: '4', type: 'WEBINAR', title: 'Budget vs actual, explained', description: 'For managers who own a budget but not a finance degree. Plain language, real examples.', length: '30 min', whenLabel: 'Dec 10 · 3:00 PM', startsAt: '2026-12-10T15:00:00Z', location: 'Online', capacity: 150 },
  { id: '5', type: 'OFFICE HOURS', title: 'Fremwork office hours', description: 'Drop in with questions about the product, the waitlist or your setup. No slides.', length: 'Weekly', whenLabel: 'Every Friday · 4:00 PM', startsAt: null, location: 'Online', capacity: 25 },
];

const DEFAULT_SETTINGS: PublicSettings = {
  acceptSignups: true,
  askCompany: true,
  requiredFields: { name: true, email: true, company: false, role: false, size: false, heard: false },
};

async function get<T>(path: string, rpc: string): Promise<T | null> {
  if (API) {
    try {
      const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
      if (res.ok) return (await res.json()) as T;
    } catch {}
  }
  // No API, or it failed: read straight from Supabase.
  try {
    const { data, error } = await (await getSupabaseServerClient()).rpc(rpc);
    return error ? null : (data as T);
  } catch {
    return null;
  }
}

export default async function EventsPage() {
  const [events, settings] = await Promise.all([get<PublicEvent[]>('/events', 'published_events'), get<PublicSettings>('/settings/public', 'public_settings')]);
  return <EventsScreen initialEvents={events && events.length > 0 ? events : DEFAULT_EVENTS} settings={settings ?? DEFAULT_SETTINGS} />;
}
