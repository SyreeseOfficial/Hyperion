import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "http://localhost:3000/api";

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`Hyperion API ${path} → ${res.status} ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

function json(body) {
  return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "hyperion", version: "1.0.0" });

server.tool(
  "list_tasks",
  "List tasks from the Hermes Kanban board",
  { assignee: z.string().optional().describe("Filter by assignee name (e.g. 'Hermes')") },
  async ({ assignee }) => {
    const tasks = await api("/tasks");
    return ok(assignee ? tasks.filter((t) => t.assignee === assignee) : tasks);
  }
);

server.tool(
  "update_task",
  "Move a task between columns or update its fields",
  {
    id: z.number().describe("Task ID"),
    status: z.enum(["backlog", "todo", "in_progress", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assignee: z.string().optional(),
    notes: z.string().optional(),
    title: z.string().optional(),
  },
  async ({ id, ...fields }) => ok(await api(`/tasks/${id}`, { method: "PATCH", ...json(fields) }))
);

server.tool(
  "create_task",
  "Add a new task to the Hermes board",
  {
    title: z.string(),
    status: z.enum(["backlog", "todo", "in_progress", "done"]).default("backlog"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    assignee: z.string().optional(),
    notes: z.string().optional(),
    due_date: z.string().optional().describe("ISO date, e.g. 2026-08-01"),
  },
  async (fields) => ok(await api("/tasks", { method: "POST", ...json(fields) }))
);

server.tool(
  "log_session",
  "Record an AI work session to Prometheus",
  {
    date: z.string().describe("ISO date, e.g. 2026-07-23"),
    provider: z.string().describe("e.g. Anthropic, OpenAI"),
    model: z.string().describe("e.g. claude-opus-4-8"),
    duration: z.number().optional().describe("Minutes"),
    tokens_in: z.number().optional(),
    tokens_out: z.number().optional(),
    cost: z.number().optional().describe("USD"),
    summary: z.string().optional(),
  },
  async (fields) => ok(await api("/sessions", { method: "POST", ...json(fields) }))
);

server.tool(
  "list_goals",
  "Read active goals from Themis",
  {},
  async () => ok(await api("/goals"))
);

server.tool(
  "post_briefing",
  "Push a morning briefing digest to the Olympus overview",
  { content: z.string().describe("Briefing text or markdown") },
  async ({ content }) => ok(await api("/briefing", { method: "POST", ...json({ content }) }))
);

server.tool(
  "list_agents",
  "List agents from the Hephaestus roster",
  {},
  async () => ok(await api("/agents"))
);

const transport = new StdioServerTransport();
await server.connect(transport);
