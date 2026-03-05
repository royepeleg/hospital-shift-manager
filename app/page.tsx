'use client';

import { useState, useEffect } from 'react';

import {
  subscribeToMembers,
  subscribeToEvents,
  addEvent as firestoreAddEvent,
} from '@/src/lib/firestore';
import { useScheduleStore } from '@/store/scheduleStore';
import { WeeklyCalendar } from '@/components/features/WeeklyCalendar';
import { AddEventModal } from '@/components/features/AddEventModal';
import { EditEventPanel } from '@/components/features/EditEventPanel';
import { CalendarEvent, FamilyMember } from '@/types';

/**
 * Computes the ISO date string (YYYY-MM-DD) for Monday of the current local week.
 */
function getCurrentWeekMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local date as an ISO string (YYYY-MM-DD).
 */
function getTodayISO(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Home page — subscribes to Firestore collections and wires live data into the UI.
 * Renders a branded Hebrew header, the weekly calendar, a floating add button,
 * the AddEventModal for creating events, and the EditEventPanel for editing.
 */
export default function Home() {
  const isLoading = useScheduleStore((s) => s.isLoading);
  const setLoading = useScheduleStore((s) => s.setLoading);
  const selectedEvent = useScheduleStore((s) => s.selectedEvent);
  const setSelectedEvent = useScheduleStore((s) => s.setSelectedEvent);

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(
    getCurrentWeekMonday()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState(getTodayISO());

  /**
   * Subscribes to Firestore members and events on mount.
   * Marks loading as done once both listeners are registered.
   * Returns a cleanup that unsubscribes both listeners on unmount.
   */
  useEffect(
    function () {
      const unsubscribeMembers = subscribeToMembers(function (data: FamilyMember[]) {
        setMembers(data);
      });

      const unsubscribeEvents = subscribeToEvents(function (data: CalendarEvent[]) {
        setEvents(data);
      });

      setLoading(false);

      return function () {
        unsubscribeMembers();
        unsubscribeEvents();
      };
    },
    [setLoading]
  );

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
   * Persists the new event to Firestore.
   */
  async function handleAddEvent(event: CalendarEvent) {
    await firestoreAddEvent(event);
  }

  /**
   * Updates the displayed week start date.
   */
  function handleWeekChange(newWeekStartDate: string) {
    setCurrentWeekStart(newWeekStartDate);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#1a73e8] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex flex-col">
      <header className="bg-[#1a73e8] px-6 py-3 shadow-md">
        <h1 className="text-xl font-semibold text-white tracking-tight">
          מנהל משמרות משפחתי
        </h1>

        <p className="text-sm text-blue-100 mt-0.5">לוח תורנויות ליד המיטה</p>
      </header>

      <main className="flex-1 w-full">
        <WeeklyCalendar
          weekStartDate={currentWeekStart}
          events={events}
          members={members}
          onDayClick={handleOpenModal}
          onWeekChange={handleWeekChange}
          onEventClick={handleEventClick}
        />
      </main>

      <button
        onClick={function () {
          handleOpenModal();
        }}
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
