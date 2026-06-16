# Clinic Management System — Frontend UI Implementation Prompt

> Every section is intentional — do not trim or summarize before pasting.

---

## 1. Project context

You are building the **React + Vite frontend** for a school clinic consultation management system. The app is role-based: four roles (nurse, doctor, lab_technician, admin) each get a distinct dashboard and a tailored set of screens. The backend REST API is already built and documented — all data comes from it.

This is an internal tool used daily by medical staff at a school. The UI must feel **clinical, calm, and trustworthy** — not a startup SaaS product, not a generic admin template. Every interaction should reduce friction for a nurse who is standing at a counter with a sick student in front of them.

---

## 2. Tech stack (non-negotiable)

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| State / server cache | TanStack Query v5 (React Query) |
| Global state | Zustand (auth slice only) |
| Styling | Tailwind CSS v3 |
| Component library | shadcn/ui (built on Radix UI) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| HTTP client | Axios (with an interceptor for JWT) |
| Notifications | Sonner (toast library) |
| Date formatting | date-fns |

Do **not** introduce any dependency not listed above without a justification comment.

---

## 3. Design system

### 3.1 Color palette

The palette is derived directly from the school's logo. The logo has two dominant colors: a **forest green** (`#4A8060`) and a **warm amber** (`#E09C46`), supported by a **dark brown** for text (`#4B3F2B`) and a **sage green** for muted elements (`#6D8662`). Every color token below is either pulled directly from the logo or derived by lightening/darkening those exact hues — nothing is invented.

```css
/* --- Brand (forest green — dominant logo color) --- */
--color-brand:         #4A8060   /* primary buttons, active nav accent bar */
--color-brand-dark:    #2E5C40   /* button hover, focus rings */
--color-brand-light:   #EAF3EE   /* active nav background, brand tint badges */

/* --- Accent (warm amber — secondary logo color) --- */
--color-accent:        #E09C46   /* warning states, open/pending status pills */
--color-accent-light:  #FDF3E3   /* warning badge backgrounds */

/* --- Text --- */
--color-text-primary:  #4B3F2B   /* headings, labels — logo's dark brown */
--color-text-muted:    #6D8662   /* metadata, timestamps — logo's sage green */

/* --- Surfaces --- */
--color-bg:            #F5F7F5   /* page background — pure white with a whisper of green */
--color-surface:       #FFFFFF   /* cards, sidebar, panels */
--color-border:        #D8E4DC   /* all borders — green-tinted gray, not cold blue-gray */

/* --- Semantic states --- */
--color-success:       #2E6648   /* closed cases, completed tests — darkened brand green */
--color-success-bg:    #EAF3EE   /* same as brand-light — intentional, keeps palette tight */
--color-warning:       #A0640A   /* open/pending text — darkened amber for legibility */
--color-warning-bg:    #FDF3E3   /* same as accent-light */
--color-danger:        #A03030   /* transfers, critical alerts — red stands apart */
--color-danger-bg:     #FAEAEA
--color-info:          #47795D   /* in-progress states — mid-tone from logo's green family */
--color-info-bg:       #EAF3EE
```

**Why this palette works for a clinic:** The green-brown palette reads as natural, calm, and trustworthy — closer to a well-designed health environment than a tech product. The amber accent creates a clear visual hierarchy for action and warning without feeling alarming. The page background (`#F5F7F5`) has a barely-perceptible green undertone that ties it to the logo without being decorative.

Define all of these as CSS custom properties in `src/index.css` and map them to Tailwind config so you can use `bg-surface`, `text-muted`, `bg-success-bg`, etc. throughout.

```js
// tailwind.config.js — colors extension
colors: {
  brand:        { DEFAULT: '#4A8060', dark: '#2E5C40', light: '#EAF3EE' },
  accent:       { DEFAULT: '#E09C46', light: '#FDF3E3' },
  surface:      '#FFFFFF',
  bg:           '#F5F7F5',
  border:       '#D8E4DC',
  'text-primary': '#4B3F2B',
  'text-muted':   '#6D8662',
  success:      { DEFAULT: '#2E6648', bg: '#EAF3EE' },
  warning:      { DEFAULT: '#A0640A', bg: '#FDF3E3' },
  danger:       { DEFAULT: '#A03030', bg: '#FAEAEA' },
  info:         { DEFAULT: '#47795D', bg: '#EAF3EE' },
}
```

### 3.2 Typography

```
Display / headings:  Inter (Google Fonts) — weights 400, 500, 600
Body / UI:           Inter — weight 400
Monospace (codes,
admission numbers):  JetBrains Mono — weight 400, 500
```

Type scale:
```
text-xs:   11px / 1.4   — metadata, timestamps, API tags
text-sm:   13px / 1.5   — table cells, secondary labels
text-base: 15px / 1.6   — body, form labels
text-lg:   18px / 1.4   — card headings, section titles
text-xl:   22px / 1.3   — page titles
text-2xl:  28px / 1.2   — stat numbers
```

### 3.3 Spacing and shape

- Page padding: `px-6 py-6` on desktop, `px-4 py-4` on mobile
- Card border-radius: `rounded-xl` (12px)
- Button border-radius: `rounded-lg` (8px)
- Input border-radius: `rounded-md` (6px)
- Consistent `gap-4` (16px) between grid items, `gap-3` (12px) inside cards
- All borders: `border border-border` (1px, `--color-border`)

### 3.4 Signature element — the status pill system

Every case, lab test, and transfer has a status. The **status pill** is the single most repeated element in this app. Make it the one perfectly-crafted thing:

```jsx
// StatusPill.jsx
// All colors derived from the logo palette — greens and amber from the logo,
// red for danger (transfers/critical), muted sage for neutral states.
const config = {
  open:              { label: 'Open',             bg: 'bg-accent-light',   text: 'text-warning',  dot: 'bg-accent'   },
  closed:            { label: 'Closed',           bg: 'bg-success-bg',     text: 'text-success',  dot: 'bg-success'  },
  pending_transfer:  { label: 'Pending transfer', bg: 'bg-danger-bg',      text: 'text-danger',   dot: 'bg-danger'   },
  requested:         { label: 'Requested',        bg: 'bg-[#F0F3F1]',      text: 'text-text-muted', dot: 'bg-text-muted' },
  in_progress:       { label: 'In progress',      bg: 'bg-brand-light',    text: 'text-brand',    dot: 'bg-brand'    },
  completed:         { label: 'Completed',        bg: 'bg-success-bg',     text: 'text-success',  dot: 'bg-success'  },
  initiated:         { label: 'Initiated',        bg: 'bg-danger-bg',      text: 'text-danger',   dot: 'bg-danger'   },
  confirmed:         { label: 'Confirmed',        bg: 'bg-success-bg',     text: 'text-success',  dot: 'bg-success'  },
  cancelled:         { label: 'Cancelled',        bg: 'bg-[#F0F3F1]',      text: 'text-text-muted', dot: 'bg-text-muted' },
}
// Render: small filled dot + label. Pill has rounded-full, px-2.5 py-0.5, text-xs font-medium.
```

---

## 4. Project structure

```
src/
├── api/
│   ├── axios.js             # Axios instance + JWT interceptor + 401 redirect
│   ├── auth.api.js
│   ├── students.api.js
│   ├── cases.api.js
│   ├── findings.api.js
│   ├── labTests.api.js
│   ├── medications.api.js
│   ├── transfers.api.js
│   └── users.api.js
├── components/
│   ├── ui/                  # shadcn/ui generated components (Button, Input, etc.)
│   ├── layout/
│   │   ├── AppShell.jsx     # Sidebar + topbar wrapper
│   │   ├── Sidebar.jsx      # Role-aware nav links
│   │   └── Topbar.jsx       # Page title + user menu
│   └── shared/
│       ├── StatusPill.jsx
│       ├── StatCard.jsx
│       ├── PageHeader.jsx
│       ├── EmptyState.jsx
│       ├── LoadingRows.jsx   # Skeleton rows for tables
│       └── ConfirmDialog.jsx
├── hooks/
│   ├── useAuth.js           # Reads Zustand auth slice
│   └── useRole.js           # Returns { isNurse, isDoctor, isLab, isAdmin }
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── StaffPage.jsx
│   │   ├── StaffForm.jsx
│   │   └── TransfersAdminPage.jsx
│   ├── nurse/
│   │   ├── NurseDashboard.jsx
│   │   └── NewCasePage.jsx
│   ├── doctor/
│   │   ├── DoctorDashboard.jsx
│   │   └── DoctorCaseDetail.jsx  # Primary doctor work screen
│   ├── lab/
│   │   ├── LabDashboard.jsx
│   │   └── LabTestDetail.jsx
│   ├── students/
│   │   ├── StudentsPage.jsx
│   │   ├── StudentDetail.jsx
│   │   └── StudentForm.jsx
│   └── cases/
│       ├── CasesPage.jsx
│       └── CaseDetail.jsx        # Shared full case view
├── store/
│   └── authStore.js         # Zustand: { user, token, login(), logout() }
├── router/
│   ├── index.jsx            # All routes + ProtectedRoute wrapper
│   └── ProtectedRoute.jsx
├── utils/
│   ├── formatDate.js        # date-fns wrappers
│   └── cn.js                # clsx + tailwind-merge
├── App.jsx
├── main.jsx
└── index.css                # CSS custom properties + Tailwind base
```

---

## 5. Authentication

### 5.1 Login page

Full-screen centered layout. No sidebar. The only page accessible without a token.

- School name or logo at top center (use a placeholder `[SCHOOL NAME]` text if no logo is provided)
- Below: a contained card (max-width 400px) with Email + Password fields and a "Sign in" button
- On submit: call `POST /api/v1/auth/login`, store token + user in Zustand + `localStorage`
- On success: redirect to the role's default dashboard (see section 7)
- On error: show an inline error message below the form — not a toast
- Show a spinner inside the button while loading — do not disable the entire form

### 5.2 Axios interceptor (`api/axios.js`)

```js
// Attach token to every request
instance.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear auth and redirect to /login
instance.interceptors.response.use(null, error => {
  if (error.response?.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = '/login'
  }
  return Promise.reject(error)
})
```

### 5.3 Protected route

```jsx
// ProtectedRoute.jsx
// If no token → redirect to /login
// If token but wrong role → redirect to the user's own dashboard
// Roles allowed: pass as prop, e.g. <ProtectedRoute roles={['admin']} />
```

---

## 6. App shell (authenticated layout)

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (240px, fixed)    │  TOPBAR (full width, 56px)  │
│                            │                             │
│  [School logo / name]      │  [Page title]    [Avatar ▼] │
│                            ├─────────────────────────────┤
│  ── [Role label pill] ──   │                             │
│                            │  PAGE CONTENT               │
│  [Nav links]               │  (scrollable)               │
│                            │                             │
│                            │                             │
│  ── bottom ──              │                             │
│  [Sign out]                │                             │
└──────────────────────────────────────────────────────────┘
```

**Sidebar details:**
- Background: `--color-surface` with a right border `--color-border`
- Active nav link: `bg-brand-light text-brand font-medium` with a 3px left accent bar `bg-brand` (forest green `#4A8060`)
- Inactive nav link: `text-text-muted hover:bg-[#F0F5F2] hover:text-text-primary`
- Each link has a Lucide icon (16px) + label
- Role pill below the logo: shows the user's role in a small `bg-brand-light text-brand` badge

**Topbar details:**
- Height 56px, `bg-surface border-b border-border`
- Left: current page title (dynamic, set by each page via a `usePageTitle` hook or React context)
- Right: avatar circle (initials from `user.name`) + dropdown with "My profile" and "Sign out"

**On mobile** (< 768px): sidebar collapses to a hamburger menu. Use a `Sheet` from shadcn/ui as the mobile drawer.

---

## 7. Role-based routing and default redirects

| Role | Default route after login | Accessible routes |
|---|---|---|
| `nurse` | `/nurse/dashboard` | `/nurse/*`, `/students/*`, `/cases/*` |
| `doctor` | `/doctor/dashboard` | `/doctor/*`, `/students/*`, `/cases/*` |
| `lab_technician` | `/lab/dashboard` | `/lab/*`, `/cases/:id` |
| `admin` | `/admin/dashboard` | `/admin/*`, `/students/*`, `/cases/*`, `/users/*` |

---

## 8. Screen specifications

### 8.1 Admin dashboard (`/admin/dashboard`)

**Stat row (top):** 6 cards in a responsive grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`

Each `StatCard` receives: `label`, `value`, `sub` (API hint), `color` prop.

| Label | Value source | Color |
|---|---|---|
| Cases today | `GET /cases` count | blue |
| Open cases | `GET /cases?status=open` | amber |
| Pending transfers | `GET /transfers/pending` count | red |
| Active staff | `GET /users?is_active=true` count | green |
| Pending lab tests | `GET /lab-tests/pending` count | purple |
| Closed today | `GET /cases?status=closed` count | green |

Fetch all six in parallel with `Promise.all` in a single `useQuery`.

**Below the stat row — two columns:**

Left column:
- **Recent cases table** — `case_id`, `student_full_name`, `grade`, `status` (StatusPill), `opened_by`, `created_at` (relative time). Clicking a row navigates to `/cases/:id`.

Right column:
- **Pending transfers list** — each item shows student name, hospital, time ago, and two action buttons: "Confirm" (`PATCH /transfers/:id/status` with `{ status: "confirmed" }`) and "Cancel" (`{ status: "cancelled" }`). Both trigger a `ConfirmDialog` before calling the API. On success: show a Sonner toast and invalidate the transfers query.

---

### 8.2 Admin staff page (`/admin/staff`)

Full-page table of users. Columns: Name, Role (badge), Email, Phone, Status (active/inactive toggle), Actions.

- **Add staff button** (top right) → opens a `Sheet` (slide-over panel) with the staff creation form
- **Deactivate** action: a `ConfirmDialog` warns "This will prevent [name] from signing in." Calls `PATCH /users/:id/deactivate`. On success, row updates to show "Inactive" badge.
- **Edit** action: opens the same `Sheet` pre-filled with the user's data

Staff form fields: Name, Email, Role (select), Phone, Password (only shown on create, not edit).

---

### 8.3 Nurse dashboard (`/nurse/dashboard`)

**Primary action — top of page, always visible:**

```
┌───────────────────────────────────────────────────────┐
│  Search student                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  🔍  Type name or admission code…               │ │
│  └─────────────────────────────────────────────────┘ │
│  Results appear below as the nurse types (debounced)  │
└───────────────────────────────────────────────────────┘
```

The search calls `GET /api/v1/students?q=...` with a 300ms debounce. Results appear as a list of student cards (name, admission code, grade, class). Clicking a student navigates to their profile at `/students/:id`.

**Below search — open cases queue:**

A table of all cases the nurse created (`GET /cases?status=open`). Columns: Student, Grade, Class, Opened, Actions. "View case" button navigates to `/cases/:id`.

**Stat row (compact, 3 cards):**
- My open cases today
- Cases I closed today
- Students seen this week

---

### 8.4 New case page (`/nurse/cases/new?student_id=:id`)

Opened after the nurse selects a student from search.

Layout:
```
[Student summary card — name, code, grade, class, mother contact]

[Nurse notes textarea — "Describe the student's complaint"]

[Open case button]
```

- Calls `POST /api/v1/cases`
- On success: redirect to `/cases/:id` (the new case detail)
- The student summary card shows `profile_pic` if available, otherwise a colored initials circle

---

### 8.5 Doctor dashboard (`/doctor/dashboard`)

**Stat row (6 cards):** same pattern as admin but with doctor-specific values (see dashboard ideas doc).

**Main content — two columns:**

Left: **Cases awaiting review** — open cases sorted by `created_at ASC` (oldest first). Each row shows student name, grade, a status badge, and a "Review" button → `/cases/:id`.

Right: **Lab results returned** — lab tests with `status = completed` that belong to cases the doctor is involved in. Shows test name, student, and a "View case" link.

---

### 8.6 Case detail page (`/cases/:id`) — the most important screen

This page is used by **nurse, doctor, and admin**. It is a single scrollable page with a sticky action bar at the bottom.

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  CASE HEADER                                            │
│  Case #10  [StatusPill: open]          [Close case btn] │
│  Opened by Head Nurse · 3 hours ago                     │
├────────────────────┬────────────────────────────────────┤
│  STUDENT PANEL     │  CASE TIMELINE (right, scrollable) │
│  (left, sticky)    │                                    │
│                    │  ▸ Nurse notes                     │
│  Profile pic       │  ▸ Findings (doctor / lab)         │
│  Jean Uwimana      │  ▸ Lab tests                       │
│  S1 Maple          │  ▸ Medications                     │
│  Admission: S001   │  ▸ Transfer (if any)               │
│                    │                                    │
│  Mother: …         │                                    │
│  Phone: …          │                                    │
└────────────────────┴────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STICKY ACTION BAR (bottom, role-aware)                 │
│  [Add findings]  [Request lab test]  [Give medication]  │
│  [Transfer to hospital]              [Close case]       │
└─────────────────────────────────────────────────────────┘
```

**Fetch strategy:** Single query to `GET /cases/:id` returns everything (findings, lab_tests, medications, transfer). Use `useQuery` with `queryKey: ['case', id]`.

**Action bar rules by role:**

| Button | Shown to | Calls |
|---|---|---|
| Add findings | doctor, lab_technician | `POST /cases/:id/findings` |
| Request lab test | nurse, doctor | `POST /cases/:id/lab-tests` |
| Give medication | nurse, doctor | `POST /cases/:id/medications` |
| Transfer to hospital | doctor only | `POST /cases/:id/transfer` |
| Close case | nurse, doctor | `PATCH /cases/:id/close` |

Each action opens a `Sheet` or `Dialog` — never a separate page. After a successful action, invalidate `['case', id]` and show a Sonner toast.

**Timeline section — each item type:**

```
Nurse notes:  border-l-4 border-[#6D8662]  — sage green, italic text in a muted card
Findings:     border-l-4 border-brand      — forest green (#4A8060), author + role + text
Lab test:     border-l-4 border-accent     — amber (#E09C46), test name + StatusPill + results
Medication:   border-l-4 border-success    — dark green (#2E6648), drug + dosage + prescriber
Transfer:     border-l-4 border-danger     — red (#A03030), hospital + reason + StatusPill
```
All timeline cards share: `bg-surface border border-border rounded-xl`. The colored left border (4px) is the only decorative thickness exception — it encodes item type at a glance.

The timeline is ordered by `created_at ASC` across all item types, interleaved. This gives medical staff a clear chronological view of everything that happened in this case.

---

### 8.7 Lab technician dashboard (`/lab/dashboard`)

The lab tech has **one job**: work through the test queue. Make this page almost entirely a queue.

**Stat row (4 cards):** Pending, In progress, Completed today, Tests this week.

**Main content — full-width queue table:**

Columns: Test name, Student (name + grade), Requested by, Requested (relative time), Status (StatusPill), Actions.

Actions per row:
- If `requested` → "Start" button → `PATCH /lab-tests/:id/results` is NOT called yet; instead update status to `in_progress` (if your API supports it — otherwise skip this step and go straight to upload)
- "Upload results" button → opens a `Dialog` with a textarea. On submit → `PATCH /lab-tests/:id/results`. On success: row updates status to `completed` via query invalidation.

Sort: `requested_at ASC` (oldest test always at top — highest priority).

Add a filter bar above the table: "All", "Requested", "In progress", "Completed" — client-side filter, no extra API call.

---

### 8.8 Students page (`/students`)

**Search bar at top** (same debounced search as nurse dashboard).

**Filters:** Grade (select), Class (select populated based on grade), then a results table.

Table columns: Admission code (monospace), Full name, Grade, Class, Gender, Actions.

Actions: "View profile" → `/students/:id`, "New case" → `/nurse/cases/new?student_id=:id` (nurse only).

**Student detail page (`/students/:id`):**

Two-column layout:
- Left card: profile photo (or initials circle), all personal details, guardian contact
- Right: case history table — all cases for this student, sorted by `created_at DESC`. Each row shows case ID, status (StatusPill), opened by, date. Clicking navigates to `/cases/:id`.

---

## 9. Shared components specification

### `StatCard`
```jsx
// Props: label (string), value (number|string), sub (string), color ('blue'|'green'|'amber'|'red'|'purple')
// Layout: bg-bg rounded-xl p-4 | label (11px uppercase muted) | value (28px 600) | sub (11px muted)
// Color applies to the value text only — card background is always bg-bg
```

### `PageHeader`
```jsx
// Props: title (string), description? (string), action? (ReactNode)
// Layout: flex justify-between items-start | left: h1 + p | right: action slot (e.g. "Add student" button)
// Bottom border: border-b border-border pb-4 mb-6
```

### `EmptyState`
```jsx
// Props: icon (Lucide component), title, description, action? (ReactNode)
// Center-aligned, muted text, icon at 40px, used when tables/lists have no data
// Example: <EmptyState icon={ClipboardList} title="No open cases" description="Open cases will appear here." />
```

### `LoadingRows`
```jsx
// Props: rows (default 5), cols (default 4)
// Renders animated skeleton rows matching the shape of a table
// Use Tailwind animate-pulse on gray-200 rounded blocks
```

### `ConfirmDialog`
```jsx
// Props: open, onOpenChange, title, description, confirmLabel, onConfirm, loading
// Uses shadcn/ui Dialog. Confirm button is red for destructive actions (deactivate, cancel transfer).
// Always show a loading spinner in the confirm button while the API call is in flight.
```

---

## 10. Forms specification

Use **React Hook Form** + **Zod** for every form. Mirror the Zod schemas from the backend — do not write separate validation logic.

General form rules:
- All required fields marked with a red asterisk `*` in the label
- Error messages appear below the field in `text-sm text-danger`
- Submit button shows a spinner and is disabled while submitting
- On API error (non-validation), show the error message in a red alert box above the submit button — not a toast, because the user needs to see it while still on the form
- On success, show a Sonner toast and either close the sheet/dialog or redirect

### Form: New case
Fields: `nurse_notes` (textarea, required). Student is already selected — show the student card above, not a field.

### Form: Add findings
Fields: `findings` (textarea, required, min 10 chars). Auto-fills `added_by_role` from JWT.

### Form: Request lab test
Fields: `test_name` (text input, required). Simple — one field, one button.

### Form: Give medication
Fields: `drug_name` (text, required), `dosage` (text, optional), `instructions` (textarea, optional).

### Form: Transfer to hospital
Fields: `hospital_name` (text, required), `reason` (textarea, optional). Show a warning alert above the form: "This will set the case to Pending transfer. The student cannot be discharged until the transfer is confirmed or cancelled."

### Form: Upload lab results
Fields: `results` (textarea, required, min 5 chars, label: "Test results"). Show the test name and student name above the form for context.

### Form: Create / edit user (admin)
Fields: `name`, `email`, `role` (select), `phone`, `password` (create only). Password field has a show/hide toggle.

### Form: Create / edit student (admin)
Fields: all student columns. `dob` uses a date input. `gender` is a radio group (Male / Female). `grade` and `class` are text inputs.

---

## 11. API integration layer (`src/api/`)

Each file exports typed functions. All functions use the shared Axios instance.

```js
// cases.api.js — example pattern for all api files
export const getCases = (params) => axios.get('/cases', { params }).then(r => r.data)
export const getCaseById = (id) => axios.get(`/cases/${id}`).then(r => r.data)
export const createCase = (body) => axios.post('/cases', body).then(r => r.data)
export const closeCase = (id) => axios.patch(`/cases/${id}/close`).then(r => r.data)
```

TanStack Query usage rules:
- `useQuery` for all GET calls — always provide `queryKey` and `staleTime: 30_000` (30s)
- `useMutation` for all POST/PATCH calls — always call `queryClient.invalidateQueries` on `onSuccess`
- Never fetch directly inside a component — always go through a `useQuery` or `useMutation` hook
- Error handling: destructure `error` from `useQuery` and show an `EmptyState`-style error block, not a console.log

---

## 12. Notifications (Sonner toasts)

```js
import { toast } from 'sonner'

// Success
toast.success('Case closed successfully')

// Error (for non-form errors like failed status updates)
toast.error('Failed to confirm transfer. Please try again.')

// Info
toast.info('Lab results uploaded. Doctor has been notified.')
```

Rules:
- Position: `bottom-right`
- Never show a toast for form validation errors — those go inline under the field
- Never show a success toast AND redirect at the same time — pick one
- Keep messages under 60 characters — no jargon, active voice

---

## 13. Empty and loading states

Every list, table, or queue must handle three states explicitly:

```jsx
// Pattern for every data screen
if (isLoading) return <LoadingRows rows={5} cols={4} />
if (error)     return <EmptyState icon={AlertCircle} title="Couldn't load cases" description="Check your connection and try again." action={<Button onClick={refetch}>Retry</Button>} />
if (!data?.length) return <EmptyState icon={ClipboardList} title="No open cases" description="Cases will appear here when a nurse opens one." />
return <CaseTable data={data} />
```

Never render an empty table with empty rows. Never show raw JSON errors to the user.

---

## 14. Responsive behavior

| Breakpoint | Sidebar | Layout |
|---|---|---|
| < 768px (mobile) | Hidden, hamburger menu opens a Sheet drawer | Single column, stacked sections |
| 768–1024px (tablet) | Collapsed to icon-only (48px wide) with tooltips | Two-column where applicable |
| > 1024px (desktop) | Full sidebar (240px) | Full layout as specified |

The case detail two-column layout collapses to single column on mobile — student panel stacks above the timeline.

---

## 15. What to generate

Build all files in the structure defined in section 4. For each file:

1. Complete implementation — no `// TODO` placeholders
2. All components must handle loading, error, and empty states
3. All forms must be wired to React Hook Form + Zod with full validation
4. All API calls must go through TanStack Query — no raw `fetch` or `useEffect` data fetching
5. All role checks must use the `useRole()` hook — never inline `user.role === 'doctor'` checks scattered through JSX

**Build order:**
`index.css` → `tailwind.config.js` → `authStore.js` → `axios.js` → all `api/*.js` files → shared components (`StatusPill`, `StatCard`, `PageHeader`, `EmptyState`, `LoadingRows`, `ConfirmDialog`) → `AppShell` + `Sidebar` + `Topbar` → `LoginPage` → `ProtectedRoute` + `router/index.jsx` → role dashboards (admin, nurse, doctor, lab) → `CaseDetail` (most complex, build last among pages) → student pages → form sheets/dialogs.
