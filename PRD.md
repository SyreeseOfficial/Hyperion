# Hyperion — Product Requirements Document

> AI Mission Control & Personal Operations Dashboard

---

## Overview

Hyperion is a personal, locally-run dashboard serving as a unified command center for AI session tracking and personal productivity. Named after the Greek Titan of heavenly light, it combines AI observability (session logs, cost, tokens) with a Kanban task manager, goal tracking, and a lightweight scratchpad — all in one place, running on localhost.

---

## Goals

- Log and review AI sessions across multiple LLM providers (cost, tokens, duration, summaries)
- Kanban task board with assignable named agents or self
- Goal tracking linked to Kanban tasks, with auto-derived progress
- Lightweight persistent scratchpad notes
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
- Search tasks, notes, sessions by name
- Quick-create: new task, new session log, scratchpad note

---

## Navigation (Greek Naming)

| Section | Greek Name | Deity/Titan | Purpose |
|---|---|---|---|
| Overview | **Olympus** | Mount Olympus | Summary stats, charts, recent activity |
| AI Sessions | **Prometheus** | Titan of fire/foresight | Log and review AI sessions |
| Tasks | **Hermes** | Messenger god | Kanban task board with agent assignment |
| Notes | **Mnemosyne** | Goddess of memory | Persistent lightweight scratchpad |
| Goals | **Themis** | Goddess of order & law | Goals with progress linked to Kanban tasks |
| Settings | **Hephaestus** | God of the forge | Agent roster, appearance, data management |

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

**Charts (below stat strip):**
- Cost over time (line/bar chart)
- Token usage over time (input + output)
- Tasks completed per day

**Activity feed (below charts):**
- Chronological feed of recent events across all sections (session logged, task moved, goal updated, note added)
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

### Hephaestus (Settings)

Three sub-sections:

**Agent Roster**
- Named list of agents (e.g. "Claude Sonnet", "GPT-4o", "Research Bot")
- Add / edit / delete agents
- New agents can also be added inline when assigning a task in Hermes

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
- **Tables:** `sessions`, `tasks`, `notes`, `goals`, `goal_tasks` (join), `agents`, `archived_tasks`
- **Backup:** User manually copies the `.db` file — no sync, no cloud

---

## Out of Scope (v1)

- Habits section
- Live agent instrumentation / real-time monitoring
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
| Settings | Agent roster + appearance tweaks + data management (its own section: Hephaestus) |

---

*Last updated: 2026-07-21*
