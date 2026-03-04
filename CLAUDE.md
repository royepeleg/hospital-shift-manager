# Hospital Family Shift Manager

A web app for managing family member shifts next to a hospital patient. Similar to a simplified Google Calendar.

## Tech Stack

- **Next.js 14** with App Router
- **React 18** + TypeScript (strict mode)
- **Tailwind CSS** for styling
- **Zustand** for global state management
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
store/              # Zustand stores
types/              # TypeScript interfaces
hooks/              # Custom hooks
utils/              # Helper functions
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
