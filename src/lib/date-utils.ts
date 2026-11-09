import { format, parse, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Format a Date object to DD-MM-YYYY in Asia/Kolkata context
 */
export function formatDateDDMMYYYY(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd-MM-yyyy');
}

/**
 * Format a Date object to readable date & time: "DD-MM-YYYY hh:mm a"
 */
export function formatDateTimeReadable(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd-MM-yyyy hh:mm a');
}

/**
 * Combine a date string (YYYY-MM-DD or DD-MM-YYYY) and a time string (e.g., "11:00 AM")
 * into a single unified JavaScript Date object.
 */
export function parseCombinedDateTime(dateStr: string | Date, timeStr?: string | null): Date {
  let baseDate: Date;
  if (dateStr instanceof Date) {
    baseDate = new Date(dateStr);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      baseDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    } else {
      // DD-MM-YYYY
      baseDate = parse(dateStr, 'dd-MM-yyyy', new Date());
    }
  } else {
    baseDate = new Date(dateStr);
  }

  if (isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }

  if (!timeStr) {
    baseDate.setHours(11, 0, 0, 0);
    return baseDate;
  }

  try {
    const trimmed = timeStr.trim();
    // Try formats: "hh:mm a", "h:mm a", "HH:mm"
    let parsedTime: Date | null = null;
    const formats = ['hh:mm a', 'h:mm a', 'HH:mm', 'H:mm', 'h:mma', 'hh:mma'];
    for (const fmt of formats) {
      const candidate = parse(trimmed, fmt, new Date());
      if (!isNaN(candidate.getTime())) {
        parsedTime = candidate;
        break;
      }
    }

    if (parsedTime) {
      baseDate.setHours(parsedTime.getHours(), parsedTime.getMinutes(), 0, 0);
    } else {
      baseDate.setHours(11, 0, 0, 0);
    }
  } catch {
    baseDate.setHours(11, 0, 0, 0);
  }

  return baseDate;
}

/**
 * Calculate delay in human-readable overdue string (e.g., "5 Hours", "2 Days", "45 Minutes")
 */
export function formatOverdueDelay(dueDateTime: Date | string): string {
  const due = typeof dueDateTime === 'string' ? parseISO(dueDateTime) : new Date(dueDateTime);
  const now = new Date();
  if (now <= due) return '0 Minutes';

  const diffDays = differenceInDays(now, due);
  if (diffDays >= 1) {
    const remainingHours = differenceInHours(now, due) % 24;
    return remainingHours > 0 ? `${diffDays} Day${diffDays > 1 ? 's' : ''} ${remainingHours} Hr${remainingHours > 1 ? 's' : ''}` : `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  }

  const diffHours = differenceInHours(now, due);
  if (diffHours >= 1) {
    const remainingMins = differenceInMinutes(now, due) % 60;
    return remainingMins > 0 ? `${diffHours} Hour${diffHours > 1 ? 's' : ''} ${remainingMins} Min` : `${diffHours} Hour${diffHours > 1 ? 's' : ''}`;
  }

  const diffMins = differenceInMinutes(now, due);
  return `${Math.max(1, diffMins)} Minute${diffMins > 1 ? 's' : ''}`;
}
