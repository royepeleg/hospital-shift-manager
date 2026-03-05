'use client';

import { useState, useEffect, useRef } from 'react';

import { CalendarEvent, FamilyMember } from '@/types';
import { DayColumn } from '@/components/ui/DayColumn';
import { addDays, formatMobileDayLabel } from '@/utils/dateUtils';
import { formatHebrewWeekRangeLabel } from '@/utils/hebrewDateUtils';

/**
 * Props for the WeeklyCalendar component.
 */
export interface WeeklyCalendarProps {
  /** ISO date string for Monday of the displayed week (e.g. '2026-03-03'). */
  weekStartDate: string;
  /** All calendar events to display. */
  events: CalendarEvent[];
  /** Full list of family members used to resolve event owners. */
  members: FamilyMember[];
  /** Called when the user clicks a day column header to add an event. Receives the day's ISO date. */
  onDayClick: (date: string) => void;
  /** Called when the user navigates to a different week. Receives Monday's ISO date. */
  onWeekChange: (newWeekStartDate: string) => void;
  /** Called when the user clicks an event block. */
  onEventClick: (event: CalendarEvent) => void;
}

/** Number of days in a week. */
const DAYS_IN_WEEK = 7;

/**
 * Generates an array of 7 ISO date strings starting from weekStartDate.
 */
function generateWeekDates(weekStartDate: string): string[] {
  return Array.from({ length: DAYS_IN_WEEK }, function (_, i) {
    return addDays(weekStartDate, i);
  });
}

/**
 * Returns today's date as a YYYY-MM-DD ISO string.
 */
function getTodayISO(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Computes the ISO date string for Monday of the current local week.
 */
function getTodayWeekStart(): string {
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
 * Fades in its children on mount; re-mounts (and re-fades) when `dayKey` changes.
 */
function FadeInWrapper({
  children,
  dayKey,
}: {
  children: React.ReactNode;
  dayKey: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(
    function () {
      const id = requestAnimationFrame(function () {
        setVisible(true);
      });

      return function () {
        cancelAnimationFrame(id);
      };
    },
    [dayKey]
  );

  return (
    <div
      className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

/**
 * Renders the full weekly calendar with week view (desktop) and day view (mobile).
 * - Week view: 7 DayColumn components in a horizontal scroll grid.
 * - Day view: a single DayColumn with prev/next day navigation arrows and swipe support.
 * A toggle button (שבועי / יומי) is visible on mobile only.
 */
export function WeeklyCalendar({
  weekStartDate,
  events,
  members,
  onDayClick,
  onWeekChange,
  onEventClick,
}: WeeklyCalendarProps) {

  const weekDates = generateWeekDates(weekStartDate);
  const weekRangeLabel = formatHebrewWeekRangeLabel(weekStartDate);

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  /**
   * Detects mobile on mount and switches to day view if needed.
   */
  useEffect(function () {
    if (window.innerWidth < 768) {
      setViewMode('day');
    }
  }, []);

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

  /**
   * Navigates to today: exact date on mobile, Monday of current week on desktop.
   */
  function handleGoToToday() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      onWeekChange(getTodayISO());
    } else {
      onWeekChange(getTodayWeekStart());
    }
  }

  /**
   * Navigates one day back in day view.
   */
  function handlePrevDay() {
    onWeekChange(addDays(weekStartDate, -1));
  }

  /**
   * Navigates one day forward in day view.
   */
  function handleNextDay() {
    onWeekChange(addDays(weekStartDate, 1));
  }

  /**
   * Toggles between week and day view modes.
   */
  function handleToggleView() {
    setViewMode(function (prev) {
      return prev === 'week' ? 'day' : 'week';
    });
  }

  /**
   * Records the X position where a touch began.
   */
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].clientX;
  }

  /**
   * Detects swipe direction and navigates one day on swipe >= 50px.
   */
  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX;

    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      handleNextDay();
    } else {
      handlePrevDay();
    }
  }

  return (
    <div className="w-full flex flex-col">
      {/* Calendar header */}
      <div className="flex items-center gap-3 py-3 px-4 bg-white border-b border-gray-200">
        <button
          onClick={handleGoToToday}
          className="px-3 py-1 rounded border border-gray-300 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
          aria-label="עבור להיום"
        >
          היום
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevWeek}
            className="hidden md:block px-3 py-1 rounded text-[#1a73e8] font-medium hover:bg-[#e8f0fe] transition-colors"
            aria-label="שבוע קודם"
          >
            →
          </button>

          <button
            onClick={handleNextWeek}
            className="hidden md:block px-3 py-1 rounded text-[#1a73e8] font-medium hover:bg-[#e8f0fe] transition-colors"
            aria-label="שבוע הבא"
          >
            ←
          </button>
        </div>

        <span className="text-sm font-semibold text-gray-700 flex-1 min-w-0">
          {viewMode === 'day' ? formatMobileDayLabel(weekStartDate) : weekRangeLabel}
        </span>

        {/* View toggle — visible on mobile only */}
        <button
          onClick={handleToggleView}
          className="md:hidden px-3 py-1 rounded border border-gray-300 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors whitespace-nowrap"
          aria-label={viewMode === 'week' ? 'עבור לתצוגה יומית' : 'עבור לתצוגה שבועית'}
        >
          {viewMode === 'week' ? 'יומי' : 'שבועי'}
        </button>
      </div>

      {/* Day view — mobile single-column layout */}
      {viewMode === 'day' && (
        <div
          className="flex flex-col flex-1"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Day navigation */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
            <button
              onClick={handlePrevDay}
              className="px-3 py-1 rounded text-[#1a73e8] font-medium hover:bg-[#e8f0fe] transition-colors"
              aria-label="יום קודם"
            >
              →
            </button>

            <button
              onClick={handleNextDay}
              className="px-3 py-1 rounded text-[#1a73e8] font-medium hover:bg-[#e8f0fe] transition-colors"
              aria-label="יום הבא"
            >
              ←
            </button>
          </div>

          <div className="p-3">
            <FadeInWrapper key={weekStartDate} dayKey={weekStartDate}>
              <DayColumn
                date={weekStartDate}
                events={events.filter(function (e: CalendarEvent) {
                  return (
                    e.date === weekStartDate &&
                    e.type !== 'parent-coverage' &&
                    e.type !== 'gap'
                  );
                })}
                members={members}
                onAddEvent={onDayClick}
                onEventClick={onEventClick}
              />
            </FadeInWrapper>
          </div>
        </div>
      )}

      {/* Week view — desktop horizontal scroll grid */}
      {viewMode === 'week' && (
        <div className="overflow-x-auto">
          <div className="grid md:grid-cols-7 grid-flow-col auto-cols-[120px] gap-2 p-3 min-w-max md:min-w-0">
            {weekDates.map(function (date) {
              const dayEvents = events.filter(function (e: CalendarEvent) {
                return e.date === date && e.type !== 'parent-coverage' && e.type !== 'gap';
              });

              return (
                <DayColumn
                  key={date}
                  date={date}
                  events={dayEvents}
                  members={members}
                  onAddEvent={onDayClick}
                  onEventClick={onEventClick}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
