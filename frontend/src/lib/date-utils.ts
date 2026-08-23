import { format, parseISO, isValid, parse } from 'date-fns';

export function formatDate(dateString: string | Date, formatPattern = 'MMM d, yyyy'): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return dateString.toString();
    return format(date, formatPattern);
  } catch {
    return dateString.toString();
  }
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    // timeStr is in "HH:mm" 24-hour format
    const parsed = parse(timeStr, 'HH:mm', new Date());
    if (!isValid(parsed)) return timeStr;
    return format(parsed, 'h:mm a');
  } catch {
    return timeStr;
  }
}

export function formatDayOfWeek(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || `Day ${dayIndex}`;
}

export function formatShortDay(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex] || `D${dayIndex}`;
}
