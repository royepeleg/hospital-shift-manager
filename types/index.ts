/** The three shift periods available in a day. */
export type ShiftType = 'morning' | 'afternoon' | 'night';

/** A family member who can be assigned to shifts. */
export interface FamilyMember {
  id: string;
  name: string;
  /** Hex color string (e.g. '#ff0000') used to visually identify this member. */
  color: string;
  phone?: string;
}

/** A single shift slot for a given date, optionally assigned to a family member. */
export interface ShiftAssignment {
  id: string;
  /** ISO 8601 date string (e.g. '2026-03-04'). */
  date: string;
  shiftType: ShiftType;
  /** Null when the shift is unassigned. */
  familyMemberId: string | null;
}

/** The full schedule for a single week. */
export interface WeeklySchedule {
  /** ISO 8601 date string representing Monday of the week. */
  weekStartDate: string;
  assignments: ShiftAssignment[];
}

/** Human-readable display labels for each shift type. */
export const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

/** Default background colors for each shift type. */
export const SHIFT_COLORS: Record<ShiftType, string> = {
  morning: '#fef9c3',
  afternoon: '#dbeafe',
  night: '#1e3a5f',
};
