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
 * Returns the later of two HH:MM time strings.
 */
function maxTime(a: string, b: string): string {
  return a > b ? a : b;
}

/**
 * Returns the earlier of two HH:MM time strings.
 */
function minTime(a: string, b: string): string {
  return a < b ? a : b;
}

/**
 * Returns true if two time ranges overlap.
 * Times are HH:MM strings (24h format).
 */
function doTimesOverlap(
  slotStart: string,
  slotEnd: string,
  eventStart: string,
  eventEnd: string
): boolean {
  return slotStart < eventEnd && slotEnd > eventStart;
}

/** Minute value of 23:59, used for the trailing-block guard. */
const DAY_END_GUARD = 23 * 60 + 59;

/** Event types that count as "covered" (not needing parents or gap). */
const COVERAGE_TYPES = new Set(['shift', 'treatment', 'visit']);

/**
 * Generates auto parent-coverage CalendarEvents for every uncovered slot
 * on the given date where NO parent-note event overlaps.
 *
 * Uncovered means not covered by shift, treatment, or visit.
 * Parent-coverage uses familyMemberId 'parents' (a fixed special ID).
 * These events are never stored — they are computed on demand.
 */
export function computeParentCoverage(
  date: string,
  events: CalendarEvent[]
): CalendarEvent[] {
  const coverageEvents = events.filter(function (e) {
    return COVERAGE_TYPES.has(e.type);
  });

  const parentNotes = events.filter(function (e) {
    return e.type === 'parent-note';
  });

  const uncovered = findUncoveredIntervals(coverageEvents, 0, DAY_END_MINUTES);

  return uncovered
    .filter(function (interval) {
      if (interval.start >= DAY_END_GUARD) return false;

      const slotStart = minutesToTime(interval.start);
      const slotEnd = intervalEndToTime(interval.end);

      if (slotStart === slotEnd) return false;

      return !parentNotes.some(function (pn) {
        return doTimesOverlap(slotStart, slotEnd, pn.startTime, pn.endTime);
      });
    })
    .map(function (interval) {
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
 * Generates gap CalendarEvents for every uncovered slot on the given date
 * where at least one parent-note event overlaps (both parents are busy).
 *
 * Uncovered means not covered by shift, treatment, or visit.
 * Gap blocks render as red 'חסר כיסוי משמרת' indicators and are never stored.
 */
export function computeGaps(
  date: string,
  events: CalendarEvent[]
): CalendarEvent[] {
  const coverageEvents = events.filter(function (e) {
    return COVERAGE_TYPES.has(e.type);
  });

  const parentNotes = events.filter(function (e) {
    return e.type === 'parent-note';
  });

  const uncovered = findUncoveredIntervals(coverageEvents, 0, DAY_END_MINUTES);

  return uncovered.flatMap(function (interval) {
    if (interval.start >= DAY_END_GUARD) return [];

    const slotStart = minutesToTime(interval.start);
    const slotEnd = intervalEndToTime(interval.end);

    if (slotStart === slotEnd) return [];

    return parentNotes
      .filter(function (pn) {
        return doTimesOverlap(slotStart, slotEnd, pn.startTime, pn.endTime);
      })
      .flatMap(function (pn) {
        const gapStart = maxTime(slotStart, pn.startTime);
        const gapEnd = minTime(slotEnd, pn.endTime);

        if (gapStart === gapEnd) return [];

        return [
          {
            id: `gap-${date}-${interval.start}-${pn.id}`,
            date,
            startTime: gapStart,
            endTime: gapEnd,
            type: 'gap' as EventType,
            familyMemberId: null,
          },
        ];
      });
  });
}
