'use client';

import { CalendarEvent, EVENT_COLORS, EVENT_LABELS, FamilyMember } from '@/types';
import { isToday } from '@/utils/dateUtils';
import { getHebrewDate, getHebrewWeekday } from '@/utils/hebrewDateUtils';
import { computeParentCoverage, computeGaps } from '@/utils/eventUtils';

/**
 * Props for the DayColumn component.
 */
export interface DayColumnProps {
  /** ISO 8601 date string for this column (e.g. '2026-03-04'). */
  date: string;
  /** Real (stored) events for this day, pre-filtered by the parent. */
  events: CalendarEvent[];
  /** Full list of family members used to resolve event owners. */
  members: FamilyMember[];
  /** Called when the user clicks the column to add a new event. */
  onAddEvent: (date: string) => void;
  /** Called when the user clicks an event block. */
  onEventClick: (event: CalendarEvent) => void;
}

/**
 * Props for the EventBlock sub-component.
 */
interface EventBlockProps {
  event: CalendarEvent;
  members: FamilyMember[];
  onClick: (event: CalendarEvent) => void;
}

/**
 * Resolves a family member's display name by ID, returning null if unassigned.
 */
function getMemberName(
  members: FamilyMember[],
  familyMemberId: string | null
): string | null {
  if (familyMemberId === null || familyMemberId === 'parents') return null;

  return members.find(function (m) { return m.id === familyMemberId; })?.name ?? null;
}

/**
 * Renders a standard colored event pill (shift, treatment, visit, parent-note).
 * Shows type label, time range, and optional member name. Clicking opens the edit panel.
 */
function EventBlock({ event, members, onClick }: EventBlockProps) {
  const memberName = getMemberName(members, event.familyMemberId);
  const bgColor = EVENT_COLORS[event.type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={function () { onClick(event); }}
      onKeyDown={function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(event);
        }
      }}
      className="rounded px-2 py-1.5 text-white text-xs leading-snug cursor-pointer hover:opacity-90 transition-opacity"
      style={{ backgroundColor: bgColor }}
    >
      <div className="font-semibold truncate">
        {event.title ?? EVENT_LABELS[event.type]}
      </div>

      <div className="opacity-80 mt-0.5">
        {event.startTime}–{event.endTime}
      </div>

      {memberName && (
        <div className="opacity-90 truncate mt-0.5">{memberName}</div>
      )}
    </div>
  );
}

/**
 * Renders a parent-coverage block (yellow, dark text).
 * Clicking opens the edit panel in read-only mode.
 */
function ParentCoverageBlock({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={function () { onClick(event); }}
      onKeyDown={function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(event);
        }
      }}
      className="rounded px-2 py-1.5 text-xs leading-snug cursor-pointer hover:opacity-90 transition-opacity"
      style={{ backgroundColor: EVENT_COLORS['parent-coverage'], color: '#1a1a1a' }}
    >
      <div className="font-semibold truncate">{EVENT_LABELS['parent-coverage']}</div>

      <div className="opacity-70 mt-0.5">
        {event.startTime}–{event.endTime}
      </div>
    </div>
  );
}

/**
 * Renders a gap block (red, white text, not clickable).
 * Indicates a time slot with no coverage — should never appear in a valid schedule.
 */
function GapBlock({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="rounded px-2 py-1.5 text-white text-xs leading-snug"
      style={{ backgroundColor: EVENT_COLORS['gap'] }}
    >
      <div className="font-semibold">{EVENT_LABELS['gap']}</div>

      <div className="opacity-80 mt-0.5">
        {event.startTime}–{event.endTime}
      </div>
    </div>
  );
}

/**
 * Renders a single day column in the weekly calendar grid.
 * Internally computes parent-coverage and gap blocks from the passed events.
 * Events are displayed in chronological order; gap/coverage blocks fill uncovered time.
 * Today's column header is highlighted in Google-blue.
 */
export function DayColumn({
  date,
  events,
  members,
  onAddEvent,
  onEventClick,
}: DayColumnProps) {
  const isCurrentDay = isToday(date);

  const hebrewWeekday = getHebrewWeekday(date);
  const gregorianDay = new Date(date).getUTCDate();
  const hebrewDate = getHebrewDate(date);

  const parentCoverage = computeParentCoverage(date, events);
  const gaps = computeGaps(date, events);

  const displayEvents = [...events, ...parentCoverage, ...gaps].sort(function (a, b) {
    return a.startTime.localeCompare(b.startTime);
  });

  const headerClasses = isCurrentDay
    ? 'w-full py-2 px-1 text-center bg-[#1a73e8] text-white'
    : 'w-full py-2 px-1 text-center bg-gray-50 text-gray-800';

  /**
   * Opens the add-event modal pre-filled with this column's date.
   */
  function handleColumnClick() {
    onAddEvent(date);
  }

  return (
    <div className="w-full flex flex-col border border-gray-200 rounded-lg overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={handleColumnClick}
        onKeyDown={function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleColumnClick();
          }
        }}
        className={`${headerClasses} cursor-pointer`}
        aria-label={`הוסף אירוע ל-${date}`}
      >
        <p className="text-xs font-medium opacity-80">{hebrewWeekday}</p>

        <p className="text-2xl font-bold leading-tight">{gregorianDay}</p>

        <p className="text-xs opacity-60">{hebrewDate}</p>
      </div>

      <div className="flex flex-col gap-1 p-1 bg-white min-h-[80px]">
        {displayEvents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 min-h-[60px]">
            לא שובץ
          </div>
        ) : (
          displayEvents.map(function (event) {
            if (event.type === 'gap') {
              return (
                <div key={event.id}>
                  <GapBlock event={event} />
                </div>
              );
            }

            if (event.type === 'parent-coverage') {
              return (
                <div key={event.id}>
                  <ParentCoverageBlock event={event} onClick={onEventClick} />
                </div>
              );
            }

            return (
              <div key={event.id}>
                <EventBlock event={event} members={members} onClick={onEventClick} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
