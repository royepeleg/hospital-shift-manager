import { CalendarEvent, EventType, isOvernight } from '@/types';
import { addDays } from '@/utils/dateUtils';

/**
 * Splits an overnight event into two adjacent CalendarEvents:
 * - Day 1: original date, startTime → '23:59'
 * - Day 2: next calendar date, '00:00' → original endTime
 *
 * Both events share a `sharedGroupId` so they can be linked later.
 * The caller is responsible for ensuring the event is actually overnight
 * before calling this function.
 */
export function splitOvernightEvent(
  event: CalendarEvent
): [CalendarEvent, CalendarEvent] {
  const groupId = event.sharedGroupId ?? event.id;

  const day1: CalendarEvent = {
    ...event,
    endTime: '23:59',
    sharedGroupId: groupId,
  };

  const day2: CalendarEvent = {
    ...event,
    id: `${event.id}-split`,
    date: addDays(event.date, 1),
    startTime: '00:00',
    sharedGroupId: groupId,
  };

  return [day1, day2];
}

export { isOvernight };

// ---------------------------------------------------------------------------
// Time-interval utilities for coverage and gap computation
// ---------------------------------------------------------------------------

/** The exclusive end of day in minutes (24 * 60 = 1440, represents "24:00"). */
const DAY_END_MINUTES = 24 * 60;

/** Represents a contiguous time interval [start, end) in minutes from midnight. */
interface TimeInterval {
  /** Inclusive start in minutes from midnight. */
  start: number;
  /** Exclusive end in minutes from midnight. */
  end: number;
}

/**
 * Converts an HH:MM time string to total minutes from midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);

  return h * 60 + m;
}

/**
 * Converts total minutes from midnight to an HH:MM time string.
 * Values at or above 1440 (24:00) are clamped to '23:59'.
 */
function minutesToTime(minutes: number): string {
  const clamped = Math.min(minutes, 23 * 60 + 59);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts an exclusive-end interval end minute to a CalendarEvent endTime string.
 * Intervals that reach the end of day (1440) are clamped to '23:59'.
 */
function intervalEndToTime(endMinute: number): string {
  return endMinute >= DAY_END_MINUTES ? '23:59' : minutesToTime(endMinute);
}

/**
 * Merges an array of CalendarEvents into sorted, non-overlapping TimeIntervals.
 * Converts each event's startTime/endTime to minute values.
 */
function mergeEventIntervals(events: CalendarEvent[]): TimeInterval[] {
  if (events.length === 0) return [];

  const intervals: TimeInterval[] = events
    .map(function (e) {
      return {
        start: timeToMinutes(e.startTime),
        end: timeToMinutes(e.endTime),
      };
    })
    .sort(function (a, b) {
      return a.start - b.start;
    });

  const merged: TimeInterval[] = [{ ...intervals[0] }];

  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const curr = intervals[i];

    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

/**
 * Returns all time intervals within [dayStart, dayEnd) that are NOT covered
 * by any of the provided events. Results are exclusive-end intervals.
 */
function findUncoveredIntervals(
  events: CalendarEvent[],
  dayStart: number,
  dayEnd: number
): TimeInterval[] {
  const merged = mergeEventIntervals(events);
  const uncovered: TimeInterval[] = [];
  let current = dayStart;

  for (const interval of merged) {
    if (interval.start > current) {
      uncovered.push({ start: current, end: interval.start });
    }

    if (interval.end > current) {
      current = interval.end;
    }
  }

  if (current < dayEnd) {
    uncovered.push({ start: current, end: dayEnd });
  }

  return uncovered;
}

/**
 * Generates auto parent-coverage CalendarEvents for every minute of the given
 * date that is NOT covered by a shift event.
 *
 * Parent-coverage uses familyMemberId 'parents' (a fixed special ID).
 * These events are never stored — they are computed on demand.
 */
export function computeParentCoverage(
  date: string,
  events: CalendarEvent[]
): CalendarEvent[] {
  const shiftEvents = events.filter(function (e) {
    return e.type === 'shift';
  });

  const uncovered = findUncoveredIntervals(shiftEvents, 0, DAY_END_MINUTES);

  return uncovered.map(function (interval) {
    return {
      id: `pc-${date}-${interval.start}`,
      date,
      startTime: minutesToTime(interval.start),
      endTime: intervalEndToTime(interval.end),
      type: 'parent-coverage' as EventType,
      familyMemberId: 'parents',
    };
  });
}

/**
 * Generates gap CalendarEvents for every minute of the given date that is NOT
 * covered by any event (including parent-coverage events).
 *
 * In a valid schedule, gaps should never appear — parent-coverage fills all
 * non-shift time. Gap blocks are rendered as red 'חסר כיסוי משמרת' indicators.
 * These events are never stored — they are computed on demand.
 */
export function computeGaps(
  date: string,
  allEvents: CalendarEvent[]
): CalendarEvent[] {
  const uncovered = findUncoveredIntervals(allEvents, 0, DAY_END_MINUTES);

  return uncovered.map(function (interval) {
    return {
      id: `gap-${date}-${interval.start}`,
      date,
      startTime: minutesToTime(interval.start),
      endTime: intervalEndToTime(interval.end),
      type: 'gap' as EventType,
      familyMemberId: null,
    };
  });
}
