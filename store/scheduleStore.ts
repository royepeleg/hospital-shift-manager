import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { FamilyMember, ShiftAssignment, ShiftType } from '../types/index';

/** Returns the ISO date string (YYYY-MM-DD) for Monday of the current week. */
function getCurrentWeekMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysFromMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);

  monday.setDate(today.getDate() + daysFromMonday);

  return monday.toISOString().split('T')[0];
}

/** Generates a unique string ID using timestamp and random suffix. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Returns the ISO date string for a date offset by `days` from the given ISO date. */
function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);

  date.setDate(date.getDate() + days);

  return date.toISOString().split('T')[0];
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
  assignments: ShiftAssignment[];
  currentWeekStart: string;

  addMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  assignShift: (
    date: string,
    shiftType: ShiftType,
    familyMemberId: string | null
  ) => void;
  unassignShift: (assignmentId: string) => void;
  setCurrentWeek: (weekStartDate: string) => void;
  getAssignmentsForWeek: (weekStartDate: string) => ShiftAssignment[];
}

/**
 * Global schedule store.
 * Manages family members, shift assignments, and the current week in view.
 */
export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    members: SEED_MEMBERS,
    assignments: [],
    currentWeekStart: getCurrentWeekMonday(),

    /** Adds a new family member to the roster. */
    addMember: function (member: FamilyMember) {
      set(function (state) {
        state.members.push(member);
      });
    },

    /** Removes a family member by ID and clears their shift assignments. */
    removeMember: function (id: string) {
      set(function (state) {
        state.members = state.members.filter(function (m) {
          return m.id !== id;
        });

        state.assignments = state.assignments.filter(function (a) {
          return a.familyMemberId !== id;
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
     * Creates or updates the shift assignment for a given date and shift type.
     * Passing null for familyMemberId effectively unassigns the slot.
     */
    assignShift: function (
      date: string,
      shiftType: ShiftType,
      familyMemberId: string | null
    ) {
      set(function (state) {
        const existing = state.assignments.find(function (a) {
          return a.date === date && a.shiftType === shiftType;
        });

        if (existing) {
          existing.familyMemberId = familyMemberId;
        } else {
          state.assignments.push({
            id: generateId(),
            date,
            shiftType,
            familyMemberId,
          });
        }
      });
    },

    /** Removes a shift assignment record entirely by its ID. */
    unassignShift: function (assignmentId: string) {
      set(function (state) {
        state.assignments = state.assignments.filter(function (a) {
          return a.id !== assignmentId;
        });
      });
    },

    /** Updates the week currently displayed in the calendar view. */
    setCurrentWeek: function (weekStartDate: string) {
      set(function (state) {
        state.currentWeekStart = weekStartDate;
      });
    },

    /**
     * Returns all assignments whose date falls within the 7-day week
     * starting on weekStartDate (Monday inclusive through Sunday inclusive).
     */
    getAssignmentsForWeek: function (weekStartDate: string) {
      const weekEndDate = addDays(weekStartDate, 6);
      const { assignments } = get();

      return assignments.filter(function (a) {
        return a.date >= weekStartDate && a.date <= weekEndDate;
      });
    },
  }))
);
