'use client';

import { FamilyMember, ShiftAssignment, ShiftType, SHIFT_LABELS } from '@/types';
import { getContrastColor } from '@/utils/colorUtils';

/**
 * Props for the ShiftSlot component.
 */
export interface ShiftSlotProps {
  shiftType: ShiftType;
  assignment: ShiftAssignment | null;
  member: FamilyMember | null;
  onClick: (shiftType: ShiftType, date: string, assignmentId: string | null) => void;
  date: string;
}

/**
 * A single shift cell in the calendar grid.
 * Shows the assigned family member's name and shift type label,
 * or an "Unassigned" state with a red dashed border when empty.
 */
export function ShiftSlot({ shiftType, assignment, member, onClick, date }: ShiftSlotProps) {
  const isAssigned = member !== null;

  const assignedClasses =
    'w-full rounded-lg p-3 cursor-pointer transition-all duration-150 ' +
    'hover:shadow-md hover:scale-[1.02] focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';

  const unassignedClasses =
    'w-full rounded-lg p-3 cursor-pointer transition-all duration-150 ' +
    'bg-white border-2 border-dashed border-red-400 ' +
    'hover:shadow-md hover:scale-[1.02] focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400';

  const ariaLabel = isAssigned
    ? `${SHIFT_LABELS[shiftType]} shift on ${date}, assigned to ${member.name}`
    : `${SHIFT_LABELS[shiftType]} shift on ${date}, unassigned`;

  function handleClick() {
    onClick(shiftType, date, assignment?.id ?? null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  if (isAssigned) {
    const textColor = getContrastColor(member.color);

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        className={assignedClasses}
        style={{ backgroundColor: member.color, color: textColor }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <p className="text-center font-bold text-sm truncate">{member.name}</p>

        <p className="text-center text-xs mt-1 opacity-80">{SHIFT_LABELS[shiftType]}</p>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={unassignedClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <p className="text-center font-bold text-sm text-red-500">Unassigned</p>

      <p className="text-center text-xs text-red-400 mt-1">{SHIFT_LABELS[shiftType]}</p>
    </div>
  );
}
