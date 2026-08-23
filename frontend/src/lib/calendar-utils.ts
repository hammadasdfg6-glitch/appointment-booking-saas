/**
 * Utilities for generating calendar events (.ics files and Google Calendar URLs)
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // e.g. "09:00" or ISO string
  endTime?: string;   // e.g. "09:45" or ISO string
  date: string;       // e.g. "2026-08-25"
}

function parseDateTime(dateStr: string, timeStr?: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 9;
  let minutes = 0;

  if (timeStr) {
    const parts = timeStr.split(':').map(Number);
    hours = parts[0] || 9;
    minutes = parts[1] || 0;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
}

/**
 * Creates a direct Google Calendar template URL
 */
export function createGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = parseDateTime(event.date, event.startTime);
  const endDate = event.endTime
    ? parseDateTime(event.date, event.endTime)
    : new Date(startDate.getTime() + 45 * 60000);

  const startFormatted = formatGoogleDate(startDate);
  const endFormatted = formatGoogleDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startFormatted}/${endFormatted}`,
    details: event.description || 'Appointment booked via AppointFlow',
    location: event.location || 'AppointFlow Service Provider',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and triggers download of an .ics calendar file for Apple Calendar & Outlook
 */
export function downloadIcsFile(event: CalendarEvent): void {
  const startDate = parseDateTime(event.date, event.startTime);
  const endDate = event.endTime
    ? parseDateTime(event.date, event.endTime)
    : new Date(startDate.getTime() + 45 * 60000);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@appointflow.com`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AppointFlow//Appointment Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || 'Appointment booked via AppointFlow').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'AppointFlow Service Provider'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `appointment-${event.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}
