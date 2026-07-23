# Hyperion

> AI Mission Control Dashboard — for humans and agents alike.

A personal, localhost-only command center for tracking AI sessions, tasks, goals, contacts, and reading lists. Built with Next.js 15, SQLite, and shadcn/ui. Named after the Greek Titan of heavenly light.

---

## What's inside

| Section | Greek Name | Purpose |
|---|---|---|
| Overview | Olympus | Stats, charts, morning briefing, activity feed |
| AI Sessions | Prometheus | Log and review AI sessions (cost, tokens, summaries) |
| Tasks | Hermes | Kanban board — assignable to you or AI agents |
| Notes | Mnemosyne | Persistent scratchpad |
| Goals | Themis | Goal tracking linked to Kanban tasks |
| CRM | Apollo | Lightweight contact manager |
| Reading List | Iris | Save URLs, Claude auto-summarizes them |
| Settings | Hephaestus | Agent roster, appearance, data management |

---

## Setup

**Requirements:** Node.js 18+, no other infrastructure.

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:3000`. The SQLite database (`hyperion.db`) is created automatically on first run.

---

## Agent Integration (MCP)

Hyperion ships an MCP (Model Context Protocol) server that wraps its REST API as named tools. Any MCP-compatible AI client — Claude Code, a scheduled agent — gets read/write access to the dashboard.

### Available tools

| Tool | What it does |
|---|---|
| `list_tasks(assignee?)` | Read the Hermes Kanban board |
| `update_task(id, status, ...)` | Move a card or update its fields |
| `create_task(title, ...)` | Add a task to the board |
| `log_session(...)` | Record an AI session to Prometheus |
| `list_goals()` | Read active goals from Themis |
| `post_briefing(content)` | Push a morning briefing to Olympus |
| `list_agents()` | List agents from the roster |

### Start the MCP server

```bash
cd mcp
npm install
```

Then register it with Claude Code by adding to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "hyperion": {
      "command": "node",
      "args": ["/absolute/path/to/Hyperion/mcp/index.mjs"]
    }
  }
}
```

> If you cloned this repo, the `mcp.json` entry should already point to the right path. Update it if your clone location differs.

### Run an agent

Each agent is a Claude Code session loaded with a system prompt from `agents/`.

**Hermes** (task execution agent):

```bash
claude --system-prompt /path/to/Hyperion/agents/hermes.md
```

In that terminal, Hermes can see the board, pick up its assigned tasks, execute them with Claude Code's tools, and update status — all reflected live in the Hyperion UI.

**Requirements for agents to work:**
- Hyperion app must be running (`npm run dev` in `app/`)
- MCP server registered in `~/.claude/mcp.json`
- Tasks on the board assigned to the agent's name (e.g. "Hermes")

---

## Tech stack

Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · better-sqlite3 · Framer Motion · @dnd-kit · Recharts · @modelcontextprotocol/sdk

---

## Data

All data lives in `hyperion.db` at the repo root. Back it up by copying the file. No cloud, no sync.
