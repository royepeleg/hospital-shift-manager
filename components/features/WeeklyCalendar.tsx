'use client';

import { FamilyMember, ShiftAssignment, ShiftType } from '@/types';
import { DayColumn } from '@/components/ui/DayColumn';
import {
  addDays,
  formatDayLabel,
  formatWeekRangeLabel,
} from '@/utils/dateUtils';

/**
 * Props for the WeeklyCalendar component.
 */
export interface WeeklyCalendarProps {
  /** ISO date string for Monday of the displayed week (e.g. '2026-03-03'). */
  weekStartDate: string;
  /** All shift assignments for the displayed week. */
  assignments: ShiftAssignment[];
  /** Full list of family members used to resolve assignment owners. */
  members: FamilyMember[];
  /** Called when the user clicks a shift slot. */
  onShiftClick: (
    shiftType: ShiftType,
    date: string,
    assignmentId: string | null
  ) => void;
  /** Called when the user navigates to a different week. Receives Monday's ISO date. */
  onWeekChange: (newWeekStartDate: string) => void;
}

/** Number of days in a week. */
const DAYS_IN_WEEK = 7;

/**
 * Generates an array of 7 ISO date strings starting from weekStartDate.
 */
function generateWeekDates(weekStartDate: string): string[] {
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) =>
    addDays(weekStartDate, i)
  );
}

/**
 * Filters the assignments array to only those matching the given date.
 */
function filterAssignmentsForDay(
  assignments: ShiftAssignment[],
  date: string
): ShiftAssignment[] {
  return assignments.filter((a) => a.date === date);
}

/**
 * Renders the full weekly calendar grid with 7 DayColumn components.
 * Includes week navigation buttons and a week range label in the header.
 * On desktop (md+) the columns are in a 7-column grid; on mobile they scroll horizontally.
 */
export function WeeklyCalendar({
  weekStartDate,
  assignments,
  members,
  onShiftClick,
  onWeekChange,
}: WeeklyCalendarProps) {
  const weekDates = generateWeekDates(weekStartDate);
  const weekRangeLabel = formatWeekRangeLabel(weekStartDate);

  /**
   * Navigates to the previous week.
   */
  function handlePrevWeek() {
    onWeekChange(addDays(weekStartDate, -DAYS_IN_WEEK));
  }

  /**
   * Navigates to the next week.
   */
  function handleNextWeek() {
    onWeekChange(addDays(weekStartDate, DAYS_IN_WEEK));
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-center gap-4 py-3 px-4 bg-white border-b border-gray-200">
        <button
          onClick={handlePrevWeek}
          className="px-3 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium transition-colors"
          aria-label="Previous week"
        >
          ←
        </button>

        <span className="text-sm font-semibold text-gray-700 min-w-0 text-center">
          {weekRangeLabel}
        </span>

        <button
          onClick={handleNextWeek}
          className="px-3 py-1 rounded hover:bg-gray-100 text-gray-600 font-medium transition-colors"
          aria-label="Next week"
        >
          →
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid md:grid-cols-7 grid-flow-col auto-cols-[minmax(140px,1fr)] gap-2 p-3 min-w-max md:min-w-0">
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              dayLabel={formatDayLabel(date)}
              assignments={filterAssignmentsForDay(assignments, date)}
              members={members}
              onShiftClick={onShiftClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
