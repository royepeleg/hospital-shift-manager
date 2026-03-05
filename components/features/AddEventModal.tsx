'use client';

import { useState } from 'react';

import {
  CalendarEvent,
  EventType,
  EVENT_COLORS,
  EVENT_LABELS,
  FamilyMember,
} from '@/types';
import { Combobox, MEMBER_COLOR_PALETTE } from '@/components/ui/Combobox';
import { addMember } from '@/src/lib/firestore';

/** Ordered list of event types rendered in the type selector (excludes auto-generated types). */
const EVENT_TYPE_OPTIONS: EventType[] = ['shift', 'treatment', 'visit', 'parent-note'];

/**
 * Props for the AddEventModal component.
 */
export interface AddEventModalProps {
  /** ISO date string to pre-fill in the date picker (e.g. '2026-03-04'). */
  defaultDate: string;
  /** List of family members available for assignment. */
  members: FamilyMember[];
  /** Called with the new CalendarEvent when the form is successfully submitted. */
  onAdd: (event: CalendarEvent) => void;
  /** Called when the modal should be dismissed without saving. */
  onClose: () => void;
}

/** Generates a unique string ID using timestamp and random suffix. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Removes all keys with undefined values from an object before
 * sending to Firestore, which does not accept undefined.
 */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(function ([_, v]) {
      return v !== undefined;
    })
  ) as Partial<T>;
}

/**
 * Modal dialog for adding a new calendar event.
 * Supports all four user-facing event types, flexible time ranges, required member
 * assignment, title, and notes. Overnight events show an informational warning.
 */
export function AddEventModal({
  defaultDate,
  members,
  onAdd,
  onClose,
}: AddEventModalProps) {
  const [type, setType] = useState<EventType>('shift');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [memberName, setMemberName] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isOvernightEvent =
    startTime !== '' && endTime !== '' && endTime < startTime;

  /**
   * Validates fields and dispatches the new event via onAdd.
   * familyMemberId is resolved from memberName — a new member is created if needed.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);

    if (!date) {
      setError('יש לבחור תאריך');
      return;
    }

    if (!startTime || !endTime) {
      setError('יש להזין שעת התחלה וסיום');
      return;
    }

    if (!memberName.trim()) {
      setError('יש לבחור שם');
      return;
    }

    const existing = members.find(
      (m) => m.name.toLowerCase() === memberName.trim().toLowerCase()
    );

    let familyMemberId: string;

    if (existing) {
      familyMemberId = existing.id;
    } else {
      const randomColor =
        MEMBER_COLOR_PALETTE[
          Math.floor(Math.random() * MEMBER_COLOR_PALETTE.length)
        ];

      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: memberName.trim(),
        color: randomColor,
      };

      await addMember(newMember);
      familyMemberId = newMember.id;
    }

    const newEvent: CalendarEvent = {
      id: generateId(),
      date,
      startTime,
      endTime,
      type,
      familyMemberId,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    };

    onAdd(stripUndefined(newEvent) as CalendarEvent);
    onClose();
  }

  /**
   * Closes the modal when the user clicks the semi-transparent backdrop.
   */
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">הוספת אירוע</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Event type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג אירוע
            </label>

            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPE_OPTIONS.map(function (t) {
                const isSelected = type === t;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={function () { setType(t); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-gray-200 text-gray-700 bg-white hover:border-gray-300'
                    }`}
                    style={isSelected ? { backgroundColor: EVENT_COLORS[t] } : {}}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EVENT_COLORS[t] }}
                    />
                    {EVENT_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תאריך
            </label>

            <input
              type="date"
              value={date}
              onChange={function (e) { setDate(e.target.value); }}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שעת התחלה
              </label>

              <input
                type="time"
                value={startTime}
                onChange={function (e) { setStartTime(e.target.value); }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שעת סיום
              </label>

              <input
                type="time"
                value={endTime}
                onChange={function (e) { setEndTime(e.target.value); }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
            </div>
          </div>

          {isOvernightEvent && (
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              אירוע לילי — יחולק אוטומטית לשני ימים
            </p>
          )}

          {/* Family member selector — required */}
          <Combobox
            members={members}
            value={memberName}
            onChange={setMemberName}
            required={true}
            submitted={submitted}
          />

          {/* Optional title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כותרת (אופציונלי)
            </label>

            <input
              type="text"
              value={title}
              onChange={function (e) { setTitle(e.target.value); }}
              placeholder="הוסף כותרת..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
            />
          </div>

          {/* Optional note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הערה (אופציונלי)
            </label>

            <textarea
              value={note}
              onChange={function (e) { setNote(e.target.value); }}
              placeholder="הוסף הערה..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8] resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>

            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: EVENT_COLORS[type] }}
            >
              הוספה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
