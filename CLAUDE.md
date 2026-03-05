# Hospital Family Shift Manager

A web app for managing family member shifts next to a hospital patient. Similar to a simplified Google Calendar.

## Tech Stack

- **Next.js 14** with App Router
- **React 18** + TypeScript (strict mode)
- **Tailwind CSS** for styling
- **Zustand** for UI state only (loading, selected event, open panels)
- **Firebase Firestore** for all persistent data
- **Prettier** for code formatting

## Folder Structure

```
app/
  layout.tsx        # Root layout
  page.tsx          # Home page
  globals.css       # Global styles
components/
  ui/               # Generic reusable components
  features/         # Feature-specific components
store/              # Zustand stores (UI state only)
types/              # TypeScript interfaces
hooks/              # Custom hooks
utils/              # Helper functions
src/
  lib/
    firebase.ts     # Firebase app init + config (uses env vars)
    firestore.ts    # All Firestore read/write logic
```

## Coding Conventions

- All components in PascalCase
- Tailwind only — no inline styles
- Mobile-first responsive design
- Props always explicitly typed with TypeScript interfaces
- Use App Router — no React Router
- Server components by default, `use client` only when needed

## Code Style (strictly enforced)

- **Function declarations only**: always use `function myFunc() {}` — NEVER arrow functions for components or named functions
- **One empty line** between every logical section, even inside functions
- **JSDoc comment** above every function, component, and hook
- **Clean code principles**: single responsibility, meaningful names, no magic numbers
- **Prettier handles all formatting** — do not override Prettier rules manually

## Prettier Config (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

## Language & RTL (strictly enforced)

- The entire app is in **Hebrew** — all labels, buttons, and UI text must be in Hebrew
- Root layout (`app/layout.tsx`) must always have `dir="rtl"` and `lang="he"` on the `<html>` element
- Always use **Heebo** font from Google Fonts (best Hebrew UI font), paired with Inter for Latin fallback
- Use **Tailwind RTL-aware classes**: `start`/`end` instead of `left`/`right` everywhere (e.g. `ps-4` not `pl-4`, `me-2` not `mr-2`)

## Standard Hebrew UI Translations (always use these exact strings)

| Concept     | Hebrew         |
|-------------|----------------|
| Morning     | בוקר           |
| Afternoon   | צהריים         |
| Night       | לילה           |
| Unassigned  | לא שובץ        |
| Today       | היום           |
| App title   | מנהל משמרות משפחתי |
| Subtitle    | לוח תורנויות ליד המיטה |

## Hebrew Calendar

- Every day column header shows **both** the Gregorian date and the Hebrew date
- Compute Hebrew dates using `Intl.DateTimeFormat` with `{ calendar: 'hebrew' }` and locale `'he-IL'`
- All Hebrew date logic lives in `utils/hebrewDateUtils.ts` — do not inline it in components

## Event Types (strictly enforced — never change these colors)

| Type              | Hebrew                | Color     |
|-------------------|-----------------------|-----------|
| `shift`           | משמרת                 | `#1a73e8` |
| `treatment`       | טיפול                 | `#e67c00` |
| `visit`           | ביקור                 | `#0f9d58` |
| `parent-note`     | הורים                 | `#a142f4` |
| `parent-coverage` | הורים עם המטופל       | `#fbbc04` |

## Data Model

- The core entity is `CalendarEvent` — **not** `ShiftAssignment`
- Each `CalendarEvent` has:
  - `id`: string
  - `date`: string (YYYY-MM-DD)
  - `startTime`: string (HH:MM, 24h)
  - `endTime`: string (HH:MM, 24h)
  - `type`: `EventType` (`'shift' | 'treatment' | 'visit' | 'parent-note' | 'parent-coverage'`)
  - `familyMemberId`: string | null
  - `title?`: string (optional free text)
  - `note?`: string (optional)

## Flexible Time & Layout

- Events are **not** locked to morning/afternoon/night slots
- All events have `startTime` and `endTime` in HH:MM (24h) format
- Time gaps between events must be visually rendered as empty space
- Cross-day events (e.g. 21:00 day 1 → 08:00 day 2) are **automatically split** into two separate events on their respective days — this splitting logic lives in `utils/eventUtils.ts`

## Mobile Responsiveness & View Modes

- Calendar has two view modes: **week** (desktop) and **day** (mobile)
- On mobile (below `md` breakpoint): show **single day view** — one column, full width, portrait layout
- Day view includes left/right navigation arrows to move between days
- Week view stays on desktop (`md+`) as horizontal scroll grid with 120px columns
- A view toggle button labeled **שבועי / יומי** is visible on mobile only

## Event Editing — EditEventPanel

- Clicking any event on the calendar opens an **EditEventPanel** (side drawer)
- EditEventPanel slides in from the **start side** (RTL: slides from the right)
- Panel shows full event details and allows editing all fields
- Same fields as AddEventModal: type, date, times, member, title, note
- **Delete button** at the bottom of the panel

## Family Member Field — Combobox (strictly enforced)

- In **all forms**, the family member selector uses a **Combobox** component (`components/ui/Combobox.tsx`)
- The Combobox allows **both** selecting an existing member from the roster **and** typing a free new name
- Label is always: **"שם"** (Name)
- The field is **mandatory** (required)

### Auto-create on new name

- If the typed value does not match any existing member, a new `FamilyMember` is **automatically created in Firestore** with:
  - `id`: auto-generated
  - `name`: the typed value
  - `color`: randomly picked from the preset palette of 8 colors (defined in `components/ui/Combobox.tsx`)
  - `phone`: `undefined`
- Auto-creation happens on form submit — not on every keystroke

## Parent Coverage (critical business logic — auto-generated)

- **Parent coverage is the DEFAULT state** — any time slot not covered by a `shift`, `treatment`, or `visit` is automatically assumed to be covered by the parents
- `parent-coverage` is a special `CalendarEvent`:
  - `type`: `'parent-coverage'`
  - `color`: `#fbbc04` (Google yellow)
  - `label`: הורים עם המטופל
  - `familyMemberId`: `'parents'` (fixed special ID)
- Parent coverage events are **auto-generated** — never manually created by users
- Parent coverage is **never a problem** — it is always valid
- Generation logic lives in `utils/eventUtils.ts`

## Shift Gap Rule (critical business logic)

- A **shift gap** (חסר כיסוי משמרת) occurs **only** when ALL of the following are true:
  1. A time slot has **no** `shift`, `treatment`, or `visit` event covering it
  2. **At least one `parent-note` event** exists during that same time slot (meaning both parents are busy and cannot be with the patient)
- In all other uncovered slots — show `parent-coverage` (yellow), never a gap
- Shift gaps are rendered as a **red block** inline in the day timeline with text: **חסר כיסוי משמרת**
- Gap calculation is per day; gap blocks appear inline between events in the day column

### Zero-duration block rule (strictly enforced)

- **Never** create any auto-generated block (`parent-coverage` or gap) where `startTime === endTime`
- **Never** create a trailing block when the last event ends at or after `23:59`

## Firebase & Data Layer (strictly enforced)

- All persistent data lives in **Firestore** — never in Zustand memory
- **Zustand is UI state only**: loading flags, selected event ID, open panel state
- Firebase app init and config live in `src/lib/firebase.ts`
- All Firestore CRUD logic lives in `src/lib/firestore.ts` — never inline Firestore calls in components
- Firebase credentials are **always read from environment variables** — never hardcoded
- Use **real-time listeners (`onSnapshot`)** for all data — never one-time `getDocs`/`getDoc` fetches

### Firestore Collections

| Collection  | Documents        |
|-------------|------------------|
| `members`   | `FamilyMember`   |
| `events`    | `CalendarEvent`  |

### Firestore Rules

- Currently in **test mode** (open read/write) — authentication will be added later
- Do not add auth guards until explicitly requested

## Design System

- Visual style: **Google Calendar** — dense, clean, minimal
- Page background: `#f6f8fc` | Card/column background: `#ffffff`
- Today highlight: `#1a73e8` (Google blue)
- Unassigned slot: `#fce8e6` background, `#d93025` text, no dashed border
- Navigation buttons: `#1a73e8` text, no background until hover (`#e8f0fe` on hover)
- Header bar: `#ffffff` with bottom box-shadow (not a border)
- Typography: medium weight day headers, small muted-gray shift labels
- Spacing: dense — Google Calendar is compact, not spacious
- Mobile: calendar grid wraps in a horizontal scroll container; day columns are exactly 120px wide and never shrink; today's column scrolls into view on mount
