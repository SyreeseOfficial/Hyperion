# Hyperion — Product Requirements Document

> AI Mission Control & Personal Operations Dashboard

---

## Overview

Hyperion is a personal, locally-run dashboard serving as a unified command center for AI session tracking and personal productivity. Named after the Greek Titan of heavenly light, it combines AI observability (session logs, cost, tokens) with a Kanban task manager, goal tracking, CRM, AI-summarized reading list, and a lightweight scratchpad — all in one place, running on localhost.

---

## Goals

- Log and review AI sessions across multiple LLM providers (cost, tokens, duration, summaries)
- Kanban task board with time tracking, assignable named agents or self
- Goal tracking linked to Kanban tasks, with auto-derived progress
- Lightweight persistent scratchpad notes
- Lightweight CRM for professional and personal contacts
- AI-summarized reading list (save URL → auto-summary via Claude)
- Finance stat strip: net worth + delta, daily spend (via Monarch Money), business revenue
- Calendar integration: today's events on Olympus (Google Calendar / iCal)
- Morning briefing digest widget on Olympus (populated by external cron)
- Greek-mythological identity that feels refined, not costume-y
- No cloud dependency — runs entirely on the user's machine

---

## Users

- **Primary:** Single user (the developer/owner)
- **Auth:** None required
- **Deployment:** Localhost only (`localhost:PORT`)

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | React + API routes in one project; no separate backend |
| Language | TypeScript | Type safety across front and back |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Components | shadcn/ui | Unstyled primitives, no fighting a component library |
| Animations | Framer Motion | Quality transitions and micro-interactions |
| Database | SQLite via `better-sqlite3` | Local file, zero infra, easy backup |
| Command Palette | `cmdk` | Cmd+K launcher |
| Charts | Recharts | Cost, tokens, task completion trend charts on Olympus |
| Kanban DnD | `@dnd-kit` | Drag-and-drop for Kanban columns |

---

## Visual Design

### Aesthetic
- **Base:** Near-black / deep obsidian background
- **Accent:** Olympian gold — moderate use on card borders, sidebar nav icons, section heading text, active/hover states
- **Secondary:** Muted warm gray for card surfaces
- **Text:** Ivory/off-white primary, warm gray secondary

### Typography
- **Headings:** Cinzel (classical Roman-Greek capitals, architectural)
- **Body / UI:** Inter (clean, modern sans-serif)
- Both loaded via Google Fonts or local font files

### Greek Theme Expression
- **Section naming** after Greek gods/titans (see Navigation)
- **Subtle iconography:** Greek key (meander) pattern as dividers/borders; laurel and column accents in section headers
- **Flavor text:** Mythological epithets as section subtitles; illustrated empty states with myth-flavored copy
- **Empty states:** Simple line-art Greek motif illustration + witty myth-flavored copy + action button

### Animations
- Framer Motion: page/section transitions, card entrance animations, hover micro-interactions
- No sound
- Motion should feel deliberate and smooth — not flashy, not instant

### What it is NOT
- Not a costume — no full marble textures, no toga illustrations
- Not dark-mode generic — Cinzel + gold + iconography make it unmistakably Hyperion

---

## Layout

```
[ Sidebar      ] [ Section Header: Name + Epithet   | Action Buttons ]
[              ] [                                                    ]
[ HYPERION     ] [  Section Content                                   ]
[ (serif gold) ] [                                                    ]
[ ------------ ] [                                                    ]
[ Nav Items    ] [                                                    ]
[ (icon+label) ] [                                                    ]
[              ] [                                                    ]
[ ------------ ] [                                                    ]
[ Settings     ] [                                                    ]
```

### Sidebar
- Fixed left
- **Expanded:** "HYPERION" wordmark (Cinzel, gold) at top + nav items with icon + label
- **Collapsed:** Icon-only strip; hover tooltip shows section name
- Settings nav item at the bottom

### Content Header (per section)
- **Left:** Greek section name in Cinzel + flavor epithet below it (small, muted)
- **Right:** Context-sensitive action buttons (e.g. "Log Session" in Prometheus, "New Task" in Hermes)

### Command Palette (Cmd+K)
- Global overlay
- Jump to any section
- Search tasks, notes, sessions, contacts, reading items by name
- Quick-create: new task, new session log, scratchpad note, new contact, save reading link

---

## Navigation (Greek Naming)

| Section | Greek Name | Deity/Titan | Purpose |
|---|---|---|---|
| Overview | **Olympus** | Mount Olympus | Summary stats, charts, briefing, calendar, recent activity |
| AI Sessions | **Prometheus** | Titan of fire/foresight | Log and review AI sessions |
| Tasks | **Hermes** | Messenger god | Kanban task board with time tracking and agent assignment |
| Notes | **Mnemosyne** | Goddess of memory | Persistent lightweight scratchpad |
| Goals | **Themis** | Goddess of order & law | Goals with progress linked to Kanban tasks |
| CRM | **Apollo** | God of communication | Contacts, interaction logs, linked tasks and goals |
| Reading List | **Iris** | Goddess of the rainbow / messenger | Save URLs, AI auto-summary via Claude |
| Settings | **Hephaestus** | God of the forge | Agent roster, appearance, data management, integrations |

---

## Sections

### Olympus (Overview)

**Stat strip:** Row of glassy dark cards, large bold number + small label.

| Stat | Timeframe |
|---|---|
| Sessions logged | User-selectable: Today / This Week / All-time (toggle above strip) |
| Total cost | Same toggle |
| Total tokens | Same toggle |
| Tasks in progress | Current |
| Open goals | Current |
| Hours today | Time logged across all tasks today |
| Business revenue | Current month (manual entry; source TBD) |

**Morning briefing card (below stat strip):**
- Collapsible digest card populated by an external agent or scheduled job (not managed by Hyperion)
- Hyperion provides a POST endpoint (`/api/briefing`) that the external job writes to
- Card displays the latest stored briefing with its timestamp
- Content sourcing (headlines, calendar, weather) deferred — to be handled by an AI agent later

**Charts (below briefing):**
- Cost over time (line/bar chart)
- Token usage over time (input + output)
- Tasks completed per day

**Activity feed (below charts):**
- Chronological feed of recent events across all sections (session logged, task moved, goal updated, note added, contact touched)
- Auto-refreshes silently every 30–60 seconds

---

### Prometheus (AI Sessions)

**Purpose:** Manual log of AI sessions — cost, tokens, duration, summary.

**View:** Sortable table

| Date | Provider | Model | Duration | Tokens In | Tokens Out | Cost | Summary |
|---|---|---|---|---|---|---|---|

- "Log Session" button opens a modal form
- **Modal fields:** date, provider (Claude / OpenAI / Gemini / Other), model name, duration, tokens in, tokens out, cost, summary text
- Click a row → expands inline (accordion) to show full summary + any extra detail
- All columns sortable

**Future (not v1):** Live agent instrumentation via POST to a local API endpoint.

---

### Hermes (Tasks)

**View:** Kanban board — 4 columns: **Backlog → To Do → In Progress → Done**

**Task card fields:**
- Title
- Assignee: named agent from roster OR "Me"
- Priority (Low / Medium / High)
- Due date (optional)
- Linked goal (optional, from Themis)
- Short notes (optional)
- Time log (start/stop timer + manual entry)

**Time tracking:**
- Start/stop timer button on each card — logs a time entry with start + end
- Manual time entry fallback (type duration)
- Total time displayed on the card face
- Multiple time entries per task (sessions accumulate)

**Behaviors:**
- Drag-and-drop cards between columns (`@dnd-kit`)
- Status dropdown as fallback on card (for precision without dragging)
- Quick-add from command palette
- Filter by assignee or priority
- **Done column:** cards stay until manually archived. Archive button per card + "Clear all Done" bulk action. Archived items viewable/deletable individually or all at once in an archive view.

---

### Mnemosyne (Notes)

**View:** Persistent scratchpad — timestamped text entries saved to SQLite.

- Simple chronological list of entries with timestamp
- Quick-add from command palette or inline input at top
- Search via command palette
- One-click "Clear all" button (with confirmation)
- Individual delete per entry
- No markdown, no rich formatting

---

### Themis (Goals)

**View:** Goal list

**Goal fields:**
- Title
- Description
- Target date
- Status (Active / Paused / Complete) — manually toggled
- Linked Kanban tasks from Hermes

**Progress:**
- Auto-calculated progress bar from % of linked tasks in "Done" column
- Manual status toggle (can mark Complete regardless of task progress)

---

### Apollo (CRM)

**Purpose:** Lightweight contact manager for professional pipeline and personal network.

**View:** Contact list with status filter tabs

**Contact fields:**
- Name
- Company (optional)
- Email / phone (optional)
- Status: Prospect / Active / Cold / Archived
- Notes (timestamped, per-contact log — similar to Mnemosyne but scoped to a contact)
- Last-touched date (auto-updated when a note is logged)
- Linked tasks (from Hermes)
- Linked goals (from Themis)

**Behaviors:**
- "Log interaction" button on each contact → quick timestamped note by default; toggle to structured form (type: call / email / meeting / message + next-step field) when needed
- Filter by status tab across the top
- Quick-add contact from command palette
- Search by name via command palette
- Click contact → detail panel / drawer with full note history + linked tasks + linked goals

---

### Iris (Reading List)

**Purpose:** Save URLs for later — Claude auto-summarizes them in the background.

**View:** List of saved items, sorted by date added

**Item fields:**
- URL
- Title (auto-fetched from page metadata, editable)
- AI summary (one-sentence TL;DR — the hook, what makes it worth reading) — generated by Claude after save
- Status: Pending / Summarized / Read / Archived
- Date added

**Behaviors:**
- Quick-add URL from command palette or inline input at top
- On save: item enters "Pending" state; a background job fetches the page and calls Claude to generate the summary, then updates status to "Summarized"
- Summary displays inline on the list item (expandable)
- Mark as Read / Archive per item
- Search by title or summary content via command palette
- Filter by status

**AI summarization:**
- Uses Claude (model configurable in Hephaestus)
- For standard URLs: fetches page HTML, extracts body text, prompts Claude for a one-sentence TL;DR
- For YouTube URLs: pulls transcript via YouTube transcript API, summarizes from transcript text
- Runs via Next.js API route; requires `ANTHROPIC_API_KEY` in env

---

### Hephaestus (Settings)

Four sub-sections:

**Agent Roster**
- Named list of agents (e.g. "Claude Sonnet", "GPT-4o", "Research Bot")
- Add / edit / delete agents
- New agents can also be added inline when assigning a task in Hermes

**Integrations**
- **Anthropic API Key:** Used for Iris AI summarization
- **Business revenue:** Manual entry for now; source TBD when income begins
- **Calendar / Monarch / briefing sources:** Deferred — to be wired by an AI agent later; Hyperion exposes `/api/briefing` for external jobs to POST into

**Appearance**
- Sidebar default state (expanded / collapsed)
- Animation speed (off / normal / reduced)
- Gold intensity (subtle / moderate / bold) — adjusts CSS variable

**Data Management**
- Show database file path
- Export data (JSON or CSV)
- Clear section data (per-section, with confirmation)

---

## Data Storage

- **Database:** SQLite file at `~/.hyperion/hyperion.db`
- **Access:** `better-sqlite3` via Next.js API routes
- **Tables:**
  - `sessions` — Prometheus AI session logs
  - `tasks` — Hermes Kanban cards
  - `archived_tasks` — Hermes archived cards
  - `time_logs` — Hermes per-task time entries (task_id, start, end, duration_minutes)
  - `notes` — Mnemosyne scratchpad entries
  - `goals` — Themis goal records
  - `goal_tasks` — join table: goals ↔ tasks
  - `agents` — Hephaestus agent roster
  - `contacts` — Apollo CRM contacts
  - `contact_notes` — Apollo per-contact timestamped interaction log
  - `contact_tasks` — join table: contacts ↔ tasks
  - `contact_goals` — join table: contacts ↔ goals
  - `reading_items` — Iris saved URLs + AI summaries
  - `briefings` — Olympus morning briefing payloads (latest wins)
- **Backup:** User manually copies the `.db` file — no sync, no cloud

---

## Agent Integration

### Vision

Hyperion is the shared workspace for a human + AI team. AI agents can read the board, pick up tasks assigned to them, execute work, and report back — the dashboard shows the shared state for both.

### The Bridge: MCP Server

A lightweight MCP (Model Context Protocol) server wraps Hyperion's existing REST API as named tools. Any MCP-compatible AI client (Claude Code, scheduled Claude agent) gets access to:

| Tool | What it does |
|---|---|
| `list_tasks(assignee?)` | Read the Hermes kanban board, optionally filtered to one agent |
| `update_task(id, status)` | Move a card between columns |
| `create_task(...)` | Add a new task to the board |
| `log_session(...)` | Record an AI work session to Prometheus |
| `list_goals()` | Read active goals from Themis |
| `post_briefing(content)` | Push a morning briefing to Olympus |

The MCP server lives at `mcp/` in the repo — a thin Node.js wrapper (~100 lines) that translates MCP tool calls into HTTP calls to `localhost:3000/api/*`. No new database layer, no duplication.

### Agent Runtime: Claude Code (Terminal)

**v1 — Terminal is the agent interface.** Each agent is a Claude Code session configured with a system prompt file. Example flow for Hermes:

1. Launch `claude` in terminal with `agents/hermes.md` as system prompt
2. Hermes calls `list_tasks(assignee: "Hermes")` → sees its queue
3. Picks a task, executes it using Claude Code's native tools (Bash, Read, Edit, Write)
4. Calls `update_task(id, "done")` when finished
5. Calls `log_session(...)` to record the session in Prometheus

The terminal chat window IS the conversation with the agent. The Hyperion UI shows the effect — cards moving, sessions appearing — in real time.

**v2 — Chat UI in Hyperion.** A chat drawer per agent: calls Anthropic API with the agent's system prompt + MCP tools, streams the response into the Hyperion UI. The dashboard becomes the single interface for both human and AI interaction. Deferred until v1 agent loop is proven.

### Pantheon → Real Agents

Each node in the Pantheon org chart maps to:

- A system prompt file at `agents/<name>.md` defining role, personality, and scope
- Assigned tasks in Hermes (via the `assignee` field)
- Optionally: a scheduled cron job that wakes the agent, checks its queue, and executes

### What to Build

| Phase | Work | Effort |
|---|---|---|
| 1 | `mcp/index.ts` — MCP server wrapping `/api/*` | ~100 lines |
| 1 | Register MCP in `~/.claude/mcp.json` | 5 lines |
| 1 | `agents/hermes.md` — Hermes system prompt | 1 file |
| 2 | Scheduled cron agent — Hermes wakes up and runs automatically | Medium |
| 3 | Chat UI in Hyperion — talk to agents from the dashboard | Large |

---

## Out of Scope (v1)

- Habits section
- Live agent instrumentation / real-time monitoring
- Chronos automations tab — scheduling is handled externally; Hyperion exposes endpoints for external jobs to write results into
- Pantheon agent org chart tab — YAGNI until the agent roster grows meaningfully
- Pomodoro / focus timer — use any browser timer
- Calendar widget on Olympus — deferred to AI agent
- Monarch Money integration — deferred to v2 or AI agent
- Morning briefing content sourcing — deferred to AI agent (endpoint exists, population is external)
- Productivity score — raw counts only, no calculated score
- Multi-user / auth
- Cloud sync or deployment
- Mobile view
- Notifications / alerts
- Native desktop app
- Direct API polling from LLM provider dashboards

---

## Resolved Design Decisions

| Decision | Choice |
|---|---|
| Logo | "HYPERION" text only, Cinzel serif, gold |
| Agent identity | User-managed named roster + inline add on task cards |
| Stat strip timeframe | User-selectable toggle: Today / This Week / All-time |
| Kanban navigation | Drag-and-drop primary, status dropdown fallback |
| Session row click | Inline accordion expand |
| Session add UX | Modal form via "Log Session" header button |
| Activity feed | On Olympus below charts, auto-refreshes every 30–60s |
| Typography | Cinzel (headings) + Inter (body) |
| Empty states | Line-art Greek illustration + myth-flavored copy + action button |
| Done tasks | Accumulate in Done column, manually archive, archive is browsable + deletable |
| Scratchpad scope | Persistent to SQLite, individual delete + clear-all button |
| Goal progress | Auto progress bar from linked tasks + manual status toggle |
| Olympus charts | Cost over time, token usage over time, tasks completed per day |
| Settings | Agent roster + integrations + appearance + data management (Hephaestus) |
| CRM scope | Full lightweight: contacts, status, quick-note log (structured form toggle), linked tasks + goals |
| CRM companies | Field only on contact — no separate company records |
| CRM ↔ sessions | Not linked — no client work yet |
| Reading list | Save URL → Claude one-sentence TL;DR in background; YouTube uses transcript |
| Time tracking | Start/stop timer + manual entry per task card; rolls up to Olympus "Hours today" stat |
| Productivity score | Skipped — raw counts only (tasks done, sessions logged) |
| Finance stats | Business revenue placeholder stat (manual entry; Monarch + sources deferred) |
| Calendar | Deferred to AI agent |
| Monarch Money | Deferred to v2 or AI agent |
| Morning briefing | External agent POSTs to `/api/briefing`; Olympus displays latest stored payload |
| Olympus density | Clean and minimal — key numbers, expand what you need |
| Automations | Handled externally; Hyperion is the display layer, not the scheduler |
| Agent org chart | Deferred (YAGNI) — Hephaestus roster is sufficient for now |

---

*Last updated: 2026-07-23*
