'use client';

import { useEffect, useRef, useState } from 'react';
import { FamilyMember } from '@/types';

/** Preset color palette for auto-creating new family members. */
export const MEMBER_COLOR_PALETTE = [
  '#1a73e8',
  '#e67c00',
  '#0f9d58',
  '#a142f4',
  '#d93025',
  '#00897b',
  '#e91e63',
  '#f57c00',
];

/**
 * Props for the Combobox component.
 */
export interface ComboboxProps {
  /** List of existing family members to show in the dropdown. */
  members: FamilyMember[];
  /** Current typed or selected value (member name string). */
  value: string;
  /** Called whenever the value changes (typed or selected). */
  onChange: (value: string) => void;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Label displayed above the input. */
  label?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Whether the form was submitted (used to show validation error). */
  submitted?: boolean;
}

/**
 * Combobox input combining a free-text field with a filtered member dropdown.
 * Allows selecting an existing FamilyMember or typing a new name.
 */
export function Combobox({
  members,
  value,
  onChange,
  placeholder = 'הקלד או בחר שם',
  label = 'שם',
  required = false,
  submitted = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = members.filter(function (m) {
    return m.name.toLowerCase().includes(value.toLowerCase());
  });

  const showError = submitted && required && value.trim() === '';

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
  }

  function handleSelect(member: FamilyMember) {
    onChange(member.name);
    setOpen(false);
  }

  function handleFocus() {
    setOpen(true);
  }

  useEffect(function handleOutsideClick() {
    function onDocumentClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocumentClick);

    return function cleanup() {
      document.removeEventListener('mousedown', onDocumentClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>

      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={[
          'w-full rounded border px-3 py-2 text-sm text-start',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          showError ? 'border-red-500' : 'border-gray-300',
        ].join(' ')}
        dir="rtl"
        autoComplete="off"
      />

      {showError && <p className="mt-1 text-xs text-red-500">שדה חובה</p>}

      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white rounded shadow-md border border-gray-200 max-h-[200px] overflow-y-auto"
          dir="rtl"
        >
          {filtered.map(function renderOption(member) {
            return (
              <li
                key={member.id}
                onMouseDown={function handleMouseDown() {
                  handleSelect(member);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#e8f0fe]"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: member.color }}
                />
                <span>{member.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
