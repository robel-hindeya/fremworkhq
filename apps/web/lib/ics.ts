/** Escapes text for an iCalendar property value (RFC 5545 §3.3.11). */
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Downloads a calendar file for an event with a real date. Returns false when there is no date to add. */
export function downloadIcs(e: { id: string; title: string; location: string; length: string; startsAt: string | null }) {
  if (!e.startsAt) return false;
  const start = new Date(e.startsAt);
  if (Number.isNaN(start.getTime())) return false;
  const mins = parseInt(e.length, 10) || 60;
  const end = new Date(start.getTime() + mins * 60000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fremwork//Events//EN', 'BEGIN:VEVENT',
    `UID:${e.id}@fremwork`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${icsText(e.title)}`, `LOCATION:${icsText(e.location)}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `fremwork-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

