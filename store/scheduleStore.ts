import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { CalendarEvent, FamilyMember, isOvernight } from '../types/index';
import {
  splitOvernightEvent,
  computeParentCoverage,
  computeGaps,
} from '../utils/eventUtils';
import { addDays } from '../utils/dateUtils';

/** Returns the ISO date string (YYYY-MM-DD) for Monday of the current local week. */
function getCurrentWeekMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysFromMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + daysFromMonday);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayStr = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${dayStr}`;
}

/** Generates a unique string ID using timestamp and random suffix. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Seed data: three family members pre-loaded so the UI is never empty. */
const SEED_MEMBERS: FamilyMember[] = [
  { id: 'member-1', name: 'Alice', color: '#f97316', phone: '555-0101' },
  { id: 'member-2', name: 'Bob', color: '#3b82f6', phone: '555-0102' },
  { id: 'member-3', name: 'Carol', color: '#22c55e', phone: '555-0103' },
];

/** Shape of the full schedule store including state and actions. */
interface ScheduleState {
  members: FamilyMember[];
  events: CalendarEvent[];
  currentWeekStart: string;

  addMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;

  addEvent: (event: CalendarEvent) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;

  setCurrentWeek: (weekStartDate: string) => void;

  /**
   * Returns all events for the given date — real events merged with
   * auto-generated parent-coverage and gap blocks — sorted by startTime.
   */
  getEventsForDay: (date: string) => CalendarEvent[];

  getEventsForWeek: (weekStartDate: string) => CalendarEvent[];
}

/**
 * Global schedule store.
 * Manages family members, calendar events, and the current week in view.
 */
export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    members: SEED_MEMBERS,
    events: [],
    currentWeekStart: getCurrentWeekMonday(),

    /** Adds a new family member to the roster. */
    addMember: function (member: FamilyMember) {
      set(function (state) {
        state.members.push(member);
      });
    },

    /** Removes a family member by ID and unassigns them from all events. */
    removeMember: function (id: string) {
      set(function (state) {
        state.members = state.members.filter(function (m) {
          return m.id !== id;
        });

        state.events.forEach(function (e) {
          if (e.familyMemberId === id) {
            e.familyMemberId = null;
          }
        });
      });
    },

    /** Merges partial updates into the matching family member record. */
    updateMember: function (id: string, updates: Partial<FamilyMember>) {
      set(function (state) {
        const member = state.members.find(function (m) {
          return m.id === id;
        });

        if (member) {
          Object.assign(member, updates);
        }
      });
    },

    /**
     * Adds a new event to the store.
     * Overnight events (endTime < startTime) are automatically split into two:
     * - Day 1: startTime → 23:59
     * - Day 2: 00:00 → endTime
     * Both halves share a sharedGroupId for future reference.
     */
    addEvent: function (event: CalendarEvent) {
      set(function (state) {
        const withId: CalendarEvent = {
          ...event,
          id: event.id || generateId(),
        };

        if (isOvernight(withId)) {
          const [day1, day2] = splitOvernightEvent(withId);

          state.events.push(day1);
          state.events.push(day2);
        } else {
          state.events.push(withId);
        }
      });
    },

    /** Removes an event by ID. Only stored (real) events can be removed. */
    removeEvent: function (id: string) {
      set(function (state) {
        state.events = state.events.filter(function (e) {
          return e.id !== id;
        });
      });
    },

    /** Merges partial updates into the matching stored event record. */
    updateEvent: function (id: string, updates: Partial<CalendarEvent>) {
      set(function (state) {
        const event = state.events.find(function (e) {
          return e.id === id;
        });

        if (event) {
          Object.assign(event, updates);
        }
      });
    },

    /** Updates the week currently displayed in the calendar view. */
    setCurrentWeek: function (weekStartDate: string) {
      set(function (state) {
        state.currentWeekStart = weekStartDate;
      });
    },

    /**
     * Returns all events for the given date, including auto-generated
     * parent-coverage blocks (yellow) and gap blocks (red), sorted by startTime.
     *
     * Parent-coverage fills any time not covered by a shift event.
     * Gap blocks appear for any minute not covered by any event at all —
     * these should never appear in a valid schedule.
     */
    getEventsForDay: function (date: string) {
      const { events } = get();

      const realEvents = events.filter(function (e) {
        return e.date === date;
      });

      const parentCoverage = computeParentCoverage(date, realEvents);

      const allEvents = [...realEvents, ...parentCoverage];
      const gaps = computeGaps(date, allEvents);

      return [...allEvents, ...gaps].sort(function (a, b) {
        return a.startTime.localeCompare(b.startTime);
      });
    },

    /**
     * Returns all stored (real) events whose date falls within the 7-day week
     * starting on weekStartDate (inclusive). Does not include auto-generated events.
     */
    getEventsForWeek: function (weekStartDate: string) {
      const weekEndDate = addDays(weekStartDate, 6);
      const { events } = get();

      return events.filter(function (e) {
        return e.date >= weekStartDate && e.date <= weekEndDate;
      });
    },
  }))
);
