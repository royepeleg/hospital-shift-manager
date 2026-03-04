'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import { WeeklyCalendar } from '@/components/features/WeeklyCalendar';
import { ShiftType } from '@/types';

/**
 * Home page — wires the Zustand schedule store to the WeeklyCalendar component.
 * Displays a branded header and the full weekly calendar below it.
 */
export default function Home() {
  const currentWeekStart = useScheduleStore((s) => s.currentWeekStart);
  const assignments = useScheduleStore((s) => s.assignments);
  const members = useScheduleStore((s) => s.members);
  const setCurrentWeek = useScheduleStore((s) => s.setCurrentWeek);
  const getAssignmentsForWeek = useScheduleStore((s) => s.getAssignmentsForWeek);

  const weekAssignments = getAssignmentsForWeek(currentWeekStart);

  /**
   * Logs the clicked shift slot to the console.
   */
  function handleShiftClick(
    shiftType: ShiftType,
    date: string,
    assignmentId: string | null
  ) {
    console.log('Shift clicked:', { shiftType, date, assignmentId });
  }

  /**
   * Updates the store with the newly selected week start date.
   */
  function handleWeekChange(newWeekStartDate: string) {
    setCurrentWeek(newWeekStartDate);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-900 text-white px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          Hospital Shift Manager
        </h1>

        <p className="text-sm text-blue-200 mt-0.5">Family care schedule</p>
      </header>

      <main className="flex-1 w-full">
        <WeeklyCalendar
          weekStartDate={currentWeekStart}
          assignments={weekAssignments}
          members={members}
          onShiftClick={handleShiftClick}
          onWeekChange={handleWeekChange}
        />
      </main>
    </div>
  );
}
