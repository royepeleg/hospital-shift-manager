import { create } from 'zustand';

import { CalendarEvent } from '@/types';

/** Shape of the UI-only schedule store. All persistent data lives in Firestore. */
interface ScheduleState {
  isLoading: boolean;
  selectedEvent: CalendarEvent | null;
  isEditPanelOpen: boolean;

  /** Sets the global loading state (e.g. while Firestore data is being fetched). */
  setLoading: (loading: boolean) => void;

  /** Sets the currently selected event (shown in EditEventPanel). */
  setSelectedEvent: (event: CalendarEvent | null) => void;

  /** Opens or closes the EditEventPanel side drawer. */
  setEditPanelOpen: (open: boolean) => void;
}

/**
 * Global UI store for the schedule app.
 * Holds only transient UI state — loading flags, selected event, and panel visibility.
 * All persistent data (events, members) is managed by Firestore via src/lib/firestore.ts.
 */
export const useScheduleStore = create<ScheduleState>()(function (set) {
  return {
    isLoading: true,
    selectedEvent: null,
    isEditPanelOpen: false,

    /** Sets the global loading flag. */
    setLoading: function (loading: boolean) {
      set({ isLoading: loading });
    },

    /** Updates the selected event and opens the edit panel when an event is provided. */
    setSelectedEvent: function (event: CalendarEvent | null) {
      set({ selectedEvent: event });
    },

    /** Controls the visibility of the EditEventPanel side drawer. */
    setEditPanelOpen: function (open: boolean) {
      set({ isEditPanelOpen: open });
    },
  };
});
