/**
 * Returns the ISO date string for Sunday of the current local week.
 * Week starts on Sunday (getDay() === 0 → offset 0).
 */
export function getCurrentWeekSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  const year = sunday.getFullYear();
  const month = String(sunday.getMonth() + 1).padStart(2, '0');
  const day = String(sunday.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Returns true if the given ISO date string matches today's local date.
 */
export function isToday(isoDate: string): boolean {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const todayStr = `${year}-${month}-${day}`;

  return isoDate === todayStr;
}

/**
 * Returns a new ISO date string offset by the given number of days.
 * Handles month/year rollovers automatically.
 */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);

  date.setUTCDate(date.getUTCDate() + days);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formats an ISO date string as a short day label: "Mon 03/03".
 */
export function formatDayLabel(isoDate: string): string {
  const date = new Date(isoDate);

  const weekday = date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${weekday} ${day}/${month}`;
}

/**
 * Formats a single day label for mobile view in Hebrew.
 * Example: "יום ראשון, 4 במרץ 2026"
 */
export function formatMobileDayLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00Z');

  const weekday = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(date);

  const dayMonthYear = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  return `${weekday}, ${dayMonthYear}`;
}

/**
 * Formats the week range label for a Sunday start date.
 * Example: "01 Mar 2026 — 07 Mar 2026"
 */
export function formatWeekRangeLabel(weekStartDate: string): string {
  const weekEndDate = addDays(weekStartDate, 6);

  const startDate = new Date(weekStartDate);
  const endDate = new Date(weekEndDate);

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  };

  const start = startDate.toLocaleDateString('en-GB', options);
  const end = endDate.toLocaleDateString('en-GB', options);

  return `${start} — ${end}`;
}
