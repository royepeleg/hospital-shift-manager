import { addDays } from '@/utils/dateUtils';

/**
 * Returns a formatted Hebrew calendar date string for the given ISO date.
 * E.g. "י״ד באדר תשפ״ו"
 * Uses Intl.DateTimeFormat with the Hebrew calendar.
 */
export function getHebrewDate(isoDate: string): string {
  const date = new Date(isoDate);

  const formatter = new Intl.DateTimeFormat('he-IL', {
    calendar: 'hebrew',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return formatter.format(date);
}

/**
 * Returns the Hebrew weekday name for the given ISO date.
 * E.g. "ראשון", "שני", "שלישי"
 */
export function getHebrewWeekday(isoDate: string): string {
  const date = new Date(isoDate);

  const formatter = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    timeZone: 'UTC',
  });

  return formatter.format(date);
}

/**
 * Returns a formatted week range label in Hebrew using Gregorian dates.
 * E.g. "3 במרץ 2026 — 9 במרץ 2026"
 */
export function formatHebrewWeekRangeLabel(weekStartDate: string): string {
  const weekEndDate = addDays(weekStartDate, 6);

  const startDate = new Date(weekStartDate);
  const endDate = new Date(weekEndDate);

  const formatter = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return `${formatter.format(startDate)} — ${formatter.format(endDate)}`;
}
