# Hyperion — Build Tasks

> One step at a time. Each step is a single vibe-coding prompt. Do not skip ahead.
> Check off as you go: replace `[ ]` with `[x]`.

---

## Phase 0 — Foundation

- [x] **0.1** Init Next.js 15 project with TypeScript and Tailwind CSS (`npx create-next-app@latest`)
- [x] **0.2** Install all dependencies at once: `better-sqlite3 @types/better-sqlite3 framer-motion @dnd-kit/core @dnd-kit/sortable cmdk recharts lucide-react`
- [x] **0.3** Install and init shadcn/ui; add components: button, dialog, drawer, input, select, tabs, badge, scroll-area, separator, tooltip
- [x] **0.4** Create the SQLite DB init module: on app start, open `~/.hyperion/hyperion.db` and run `CREATE TABLE IF NOT EXISTS` for all tables — `sessions`, `tasks`, `archived_tasks`, `time_logs`, `notes`, `goals`, `goal_tasks`, `agents`, `contacts`, `contact_notes`, `contact_tasks`, `contact_goals`, `reading_items`, `briefings`
- [x] **0.5** Write out the full schema (columns + types) for every table as a single migration file before touching any UI

---

## Phase 1 — Design System

- [x] **1.1** Configure Tailwind theme: add CSS variables for `--gold`, `--obsidian`, `--ivory`, `--warm-gray`; wire gold intensity levels (subtle / moderate / bold) as a data attribute on `<html>`
- [x] **1.2** Load Cinzel and Inter via `next/font`; apply Cinzel to headings globally, Inter to body
- [x] **1.3** Build the app shell: fixed sidebar (left) + main content area. Sidebar has the HYPERION wordmark (Cinzel, gold), nav items (icon + label), and a Settings item pinned to the bottom
- [x] **1.4** Add sidebar collapse: toggle between expanded (wordmark + icon + label) and collapsed (icon-only strip with tooltip on hover). Persist preference to localStorage
- [x] **1.5** Build the `SectionHeader` component: left side = section name (Cinzel, gold) + epithet below it (small, muted); right side = slot for action buttons
- [x] **1.6** Build the `StatCard` component: glassy dark card, large bold number, small label below. Used in the Olympus stat strip
- [x] **1.7** Build the `EmptyState` component: Greek key border, placeholder illustration area, myth-flavored copy slot, action button slot

---

## Phase 2 — Prometheus (AI Sessions)

- [ ] **2.1** API routes: `GET /api/sessions` (list, sortable by any column), `POST /api/sessions` (create), `DELETE /api/sessions/[id]`
- [ ] **2.2** Sessions table UI: columns = Date, Provider, Model, Duration, Tokens In, Tokens Out, Cost, Summary (truncated). All columns sortable by clicking header
- [ ] **2.3** Accordion row expand: clicking a row expands inline to show full summary text + any extra fields. Clicking again collapses it
- [ ] **2.4** "Log Session" button in the section header opens a modal. Fields: date, provider (select: Claude / OpenAI / Gemini / Other), model name, duration, tokens in, tokens out, cost, summary (textarea). Submit hits `POST /api/sessions`

---

## Phase 3 — Hermes (Tasks)

- [ ] **3.1** API routes: `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/[id]` (update fields or status), `DELETE /api/tasks/[id]`, `POST /api/tasks/[id]/archive`, `GET /api/tasks/archived`, `DELETE /api/tasks/archived/[id]`, `DELETE /api/tasks/archived` (bulk)
- [ ] **3.2** Kanban board layout: 4 columns (Backlog, To Do, In Progress, Done) rendered side by side with horizontal scroll if needed
- [ ] **3.3** Task card component: title, assignee badge, priority badge (Low / Medium / High with color), due date, total time logged, linked goal name (if any). Cards are tall enough to show all fields at a glance
- [ ] **3.4** Task creation: "New Task" button in header opens a modal. Fields: title, assignee (select from agent roster + "Me"), priority, due date, linked goal, notes
- [ ] **3.5** Drag-and-drop between columns using `@dnd-kit`. On drop, PATCH the task's status. Status dropdown on the card as a fallback (no drag needed)
- [ ] **3.6** Filter bar above the board: filter by assignee and/or priority. Filters are additive. "Clear filters" resets
- [ ] **3.7** Time tracking on task cards: start/stop timer button — on start, record timestamp; on stop, write a `time_logs` entry. Manual entry field (type minutes). Show total time on card face. Expandable log list inside the card detail view
- [ ] **3.8** Done column archive flow: each Done card has an "Archive" button. "Clear all Done" bulk action at column top. Archive view is a separate drawer/page listing archived tasks with individual delete and "Delete all"

---

## Phase 4 — Mnemosyne (Notes)

- [ ] **4.1** API routes: `GET /api/notes`, `POST /api/notes`, `DELETE /api/notes/[id]`, `DELETE /api/notes` (clear all)
- [ ] **4.2** Notes UI: inline text input pinned to the top of the section. Below it, a chronological list of entries — each shows timestamp + text + a delete icon on hover. "Clear all" button with a confirmation dialog at the top right

---

## Phase 5 — Themis (Goals)

- [ ] **5.1** API routes: `GET /api/goals`, `POST /api/goals`, `PATCH /api/goals/[id]`, `DELETE /api/goals/[id]`, `POST /api/goals/[id]/tasks` (link a task), `DELETE /api/goals/[id]/tasks/[taskId]`
- [ ] **5.2** Goals list UI: each goal card shows title, description, target date, status badge (Active / Paused / Complete), progress bar (% of linked tasks in Done), and a list of linked task titles
- [ ] **5.3** Goal creation modal: title, description, target date, status
- [ ] **5.4** Link tasks to a goal: inside the goal detail view, a task picker (search/select from existing tasks). Linked tasks show inline with their current Kanban status. Progress bar auto-updates

---

## Phase 6 — Apollo (CRM)

- [ ] **6.1** API routes: `GET /api/contacts`, `POST /api/contacts`, `PATCH /api/contacts/[id]`, `DELETE /api/contacts/[id]`, `GET /api/contacts/[id]/notes`, `POST /api/contacts/[id]/notes`, `DELETE /api/contacts/[id]/notes/[noteId]`
- [ ] **6.2** Contact list UI: status filter tabs at top (All / Prospect / Active / Cold / Archived). Each row shows name, company (if any), status badge, last-touched date. Click row to open detail drawer
- [ ] **6.3** Contact detail drawer (slides in from right): shows all fields, full chronological interaction log, linked tasks, linked goals
- [ ] **6.4** Log interaction: "Log" button on the drawer opens a quick note input (textarea + save). Toggle to structured form: type select (call / email / meeting / message) + notes + next-step field. On save, write to `contact_notes` and update `last_touched` on the contact
- [ ] **6.5** Link tasks and goals to a contact: inside the detail drawer, pickers for existing tasks and goals (same pattern as Themis). Remove links inline

---

## Phase 7 — Iris (Reading List)

- [ ] **7.1** API routes: `GET /api/reading`, `POST /api/reading` (save URL, trigger summarization async), `PATCH /api/reading/[id]` (update status), `DELETE /api/reading/[id]`
- [ ] **7.2** Reading list UI: URL input at top of section. Below: list of items — title, one-sentence summary (or "Summarizing…" spinner), status badge, date added. Mark as Read / Archive buttons per item. Filter tabs: All / Pending / Summarized / Read / Archived
- [ ] **7.3** Summarization API route (`POST /api/reading/[id]/summarize`): detect if URL is YouTube or standard. For standard: fetch HTML, strip to body text, call Claude with prompt for a one-sentence TL;DR. Update `reading_items` row with summary and status = Summarized
- [ ] **7.4** YouTube transcript support: detect `youtube.com` or `youtu.be` in URL. Use `youtube-transcript` npm package to pull the transcript. Pass transcript text to Claude instead of fetched HTML. Fall back to metadata-only if transcript unavailable
- [ ] **7.5** Wire async trigger: after `POST /api/reading` saves the item as Pending, immediately call the summarize route in the background (no awaiting on the client). Item shows "Summarizing…" and the list polls or revalidates until status flips to Summarized

---

## Phase 8 — Hephaestus (Settings)

- [ ] **8.1** API routes for agents: `GET /api/agents`, `POST /api/agents`, `PATCH /api/agents/[id]`, `DELETE /api/agents/[id]`
- [ ] **8.2** Agent roster UI: list of agents with name + edit/delete per row. Inline add form at the bottom. These agents populate the assignee dropdowns in Hermes
- [ ] **8.3** Integrations panel: Anthropic API key input (stored in a local `.env.local` or written to a `settings` table — never in the DB in plaintext if avoidable; prefer `.env.local`). Business revenue: a number input that writes to a `settings` table for display on Olympus
- [ ] **8.4** Appearance settings UI: sidebar default (expanded / collapsed) — writes to a `settings` row; animation speed (off / normal / reduced) — sets a CSS class on `<html>`; gold intensity (subtle / moderate / bold) — sets the `--gold` CSS variable via a data attribute
- [ ] **8.5** Data management panel: show the DB file path. Export button — `GET /api/export?format=json|csv` that serializes all tables. Per-section "Clear data" buttons with a confirmation dialog each

---

## Phase 9 — Olympus (Overview)

*Build last — it aggregates from everything else.*

- [ ] **9.1** API route `GET /api/stats`: returns all stat strip values in one query — session count, total cost, total tokens (with timeframe filter: today / this week / all-time), tasks in progress count, open goals count, hours logged today, business revenue (from settings)
- [ ] **9.2** Stat strip UI: row of `StatCard` components wired to `/api/stats`. Timeframe toggle (Today / This Week / All-time) above the strip — updates the session/cost/token cards only
- [ ] **9.3** Charts section: three `Recharts` charts — cost over time (bar), token usage over time (input + output, stacked bar or line), tasks completed per day (bar). Each chart queries its own API route
- [ ] **9.4** Activity feed: `GET /api/activity` returns a merged chronological list of recent events (session logged, task moved, goal updated, note added, contact touched) with type label + timestamp. Feed auto-refreshes every 30 seconds using `setInterval` + revalidation
- [ ] **9.5** Morning briefing card: `POST /api/briefing` accepts a JSON payload and stores it in the `briefings` table (only the latest row matters). `GET /api/briefing` returns the latest. Collapsible card on Olympus shows the payload content + timestamp. If no briefing exists, show a minimal empty state (no illustration needed here)

---

## Phase 10 — Command Palette

- [ ] **10.1** Wire `cmdk` as a global overlay triggered by `Cmd+K` (or `Ctrl+K`). Renders above everything, closes on `Esc` or outside click
- [ ] **10.2** Navigation group: items for each section (Olympus, Prometheus, Hermes, etc.) — selecting one routes to that section and closes the palette
- [ ] **10.3** Search group: live search across tasks (title), notes (text), sessions (summary), contacts (name), reading items (title + summary). Results appear as you type, grouped by type. Selecting a result navigates to the relevant section and highlights/opens the item
- [ ] **10.4** Quick-create group: "New Task", "Log Session", "New Note", "New Contact", "Save Link" — each opens the relevant modal/input directly without navigating away from the current section

---

## Phase 11 — Polish

- [ ] **11.1** Framer Motion page transitions: wrap each section in a motion div with `initial={{ opacity: 0, y: 8 }}` and `animate={{ opacity: 1, y: 0 }}`. Respect the animation speed setting (off = no motion, reduced = instant, normal = 200ms)
- [ ] **11.2** Framer Motion card entrance: task cards, contact rows, reading items, session rows animate in on mount with a staggered delay
- [ ] **11.3** Write the myth-flavored epithets and empty-state copy for each section. Plug them into the `EmptyState` component:
  - Olympus: *"The mountain awaits its first dispatch."*
  - Prometheus: *"No fire stolen yet. Log your first session."*
  - Hermes: *"The board is clear. What does the messenger carry?"*
  - Mnemosyne: *"Memory has no entries. What must not be forgotten?"*
  - Themis: *"No law yet written. Set your first intention."*
  - Apollo: *"No souls yet known. Who will you track?"*
  - Iris: *"The rainbow carries no messages. Save your first link."*
- [ ] **11.4** Add hover micro-interactions: stat cards lift slightly on hover, nav items glow gold, task cards show action buttons on hover
- [ ] **11.5** Final QA pass: walk through every section end-to-end — create, read, update, delete, empty states, archive flows, command palette search, settings persistence, DB path display, export

---

## Notes

- **Order matters**: phases 0–1 are prerequisites for everything. Prometheus and Mnemosyne are the simplest sections — good to build confidence before Hermes (DnD) and Iris (async AI). Olympus goes last.
- **Each step = one AI session.** Give the AI the step description + relevant PRD section. Don't combine steps.
- **DB schema (step 0.5) is load-bearing.** Get it right before any UI. Schema changes mid-build are painful.
- **Iris async (step 7.5)** is the trickiest step — Next.js doesn't have true background jobs. Use a fire-and-forget fetch or a route that responds immediately and processes async. Keep it simple.
