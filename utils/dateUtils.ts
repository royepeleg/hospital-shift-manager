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
