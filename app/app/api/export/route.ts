import { getDb } from "@/lib/db";

const TABLES = ["sessions", "tasks", "archived_tasks", "time_logs", "notes", "goals", "agents", "contacts", "contact_notes", "contact_tasks", "contact_goals", "reading_items", "briefings"];

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const db = getDb();
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    data[t] = db.prepare(`SELECT * FROM ${t}`).all();
  }

  if (format === "csv") {
    const lines: string[] = [];
    for (const [table, rows] of Object.entries(data)) {
      if (!rows.length) continue;
      lines.push(`\n# ${table}`);
      const keys = Object.keys(rows[0] as object);
      lines.push(keys.join(","));
      for (const row of rows) {
        lines.push(keys.map((k) => JSON.stringify((row as Record<string, unknown>)[k] ?? "")).join(","));
      }
    }
    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=hyperion-export.csv" },
    });
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=hyperion-export.json" },
  });
}
