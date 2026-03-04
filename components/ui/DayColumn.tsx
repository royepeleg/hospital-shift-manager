'use client';

import { FamilyMember, ShiftAssignment, ShiftType } from '@/types';
import { ShiftSlot } from '@/components/ui/ShiftSlot';
import { isToday } from '@/utils/dateUtils';

/** Ordered list of shift types rendered top-to-bottom in the column. */
const SHIFT_ORDER: ShiftType[] = ['morning', 'afternoon', 'night'];

/**
 * Props for the DayColumn component.
 */
export interface DayColumnProps {
  /** ISO 8601 date string for this column (e.g. '2026-03-04'). */
  date: string;
  /** Human-readable label shown at the top of the column (e.g. 'Monday 03/03'). */
  dayLabel: string;
  /** All shift assignments that belong to this day. */
  assignments: ShiftAssignment[];
  /** Full list of family members used to resolve assignment owners. */
  members: FamilyMember[];
  /** Called when the user clicks any shift slot in this column. */
  onShiftClick: (
    shiftType: ShiftType,
    date: string,
    assignmentId: string | null
  ) => void;
}

/**
 * Renders a single day column in the weekly calendar grid.
 * Shows a day label header and three vertically stacked ShiftSlots
 * (morning, afternoon, night).
 * Today's column header is highlighted with a blue background.
 */
export function DayColumn({
  date,
  dayLabel,
  assignments,
  members,
  onShiftClick,
}: DayColumnProps) {
  const isCurrentDay = isToday(date);

  const headerClasses = isCurrentDay
    ? 'w-full py-2 px-1 text-center font-bold text-sm bg-blue-500 text-white'
    : 'w-full py-2 px-1 text-center font-bold text-sm bg-gray-100 text-gray-800';

  /**
   * Finds the ShiftAssignment for the given shift type, or null if none exists.
   */
  function findAssignment(shiftType: ShiftType): ShiftAssignment | null {
    return assignments.find((a) => a.shiftType === shiftType) ?? null;
  }

  /**
   * Resolves the FamilyMember for a given assignment, or null if unassigned.
   */
  function findMember(assignment: ShiftAssignment | null): FamilyMember | null {
    if (assignment === null || assignment.familyMemberId === null) return null;

    return members.find((m) => m.id === assignment.familyMemberId) ?? null;
  }

  return (
    <div className="w-full flex flex-col border border-gray-200 rounded-lg overflow-hidden">
      <div className={headerClasses}>{dayLabel}</div>

      <div className="flex flex-col gap-2 p-2 bg-white">
        {SHIFT_ORDER.map((shiftType) => {
          const assignment = findAssignment(shiftType);
          const member = findMember(assignment);

          return (
            <ShiftSlot
              key={shiftType}
              shiftType={shiftType}
              assignment={assignment}
              member={member}
              onClick={onShiftClick}
              date={date}
            />
          );
        })}
      </div>
    </div>
  );
}
