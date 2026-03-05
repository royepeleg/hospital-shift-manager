'use client';

import { useState } from 'react';

import { useScheduleStore } from '@/store/scheduleStore';
import { WeeklyCalendar } from '@/components/features/WeeklyCalendar';
import { AddEventModal } from '@/components/features/AddEventModal';
import { EditEventPanel } from '@/components/features/EditEventPanel';
import { CalendarEvent } from '@/types';

/** Returns today's local date as an ISO string (YYYY-MM-DD). */
function getTodayISO(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Home page — wires the Zustand schedule store to the WeeklyCalendar component.
 * Displays a branded Hebrew header, the full weekly calendar, a floating ➕ button,
 * the AddEventModal for creating events, and the EditEventPanel for viewing/editing.
 */
export default function Home() {
  const currentWeekStart = useScheduleStore((s) => s.currentWeekStart);
  const members = useScheduleStore((s) => s.members);
  const setCurrentWeek = useScheduleStore((s) => s.setCurrentWeek);
  const addEvent = useScheduleStore((s) => s.addEvent);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState(getTodayISO());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  /**
   * Opens the Add Event modal pre-filled with the given date.
   */
  function handleOpenModal(date?: string) {
    setModalDefaultDate(date ?? getTodayISO());
    setIsModalOpen(true);
  }

  /**
   * Closes the Add Event modal.
   */
  function handleCloseModal() {
    setIsModalOpen(false);
  }

  /**
   * Passes the new event to the store (overnight events are auto-split there).
   */
  function handleAddEvent(event: CalendarEvent) {
    addEvent(event);
  }

  /**
   * Updates the store with the newly selected week start date.
   */
  function handleWeekChange(newWeekStartDate: string) {
    setCurrentWeek(newWeekStartDate);
  }

  /**
   * Opens the EditEventPanel for the clicked event.
   */
  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event);
  }

  /**
   * Closes the EditEventPanel.
   */
  function handleClosePanel() {
    setSelectedEvent(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex flex-col">
      <header className="bg-white shadow-sm px-6 py-3">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
          מנהל משמרות משפחתי
        </h1>

        <p className="text-sm text-gray-500 mt-0.5">לוח תורנויות ליד המיטה</p>
      </header>

      <main className="flex-1 w-full">
        <WeeklyCalendar
          weekStartDate={currentWeekStart}
          members={members}
          onDayClick={handleOpenModal}
          onWeekChange={handleWeekChange}
          onEventClick={handleEventClick}
        />
      </main>

      <button
        onClick={function () { handleOpenModal(); }}
        className="fixed bottom-6 end-6 w-14 h-14 rounded-full bg-[#1a73e8] text-white text-3xl shadow-lg hover:bg-[#1557b0] active:scale-95 transition-all flex items-center justify-center z-40"
        aria-label="הוסף אירוע"
      >
        +
      </button>

      {isModalOpen && (
        <AddEventModal
          defaultDate={modalDefaultDate}
          members={members}
          onAdd={handleAddEvent}
          onClose={handleCloseModal}
        />
      )}

      <EditEventPanel
        event={selectedEvent}
        members={members}
        onClose={handleClosePanel}
      />
    </div>
  );
}
