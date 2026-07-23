import { getDb } from "@/lib/db";

// Tables that can be imported, in FK-safe order
const IMPORTABLE = [
  "goals", "sessions", "notes", "briefings",
  "agents", "contacts",
  "tasks", "archived_tasks",
  "contact_notes", "contact_tasks", "contact_goals",
  "reading_items", "time_logs",
] as const;

export async function POST(req: Request) {
  const body = await req.json() as Record<string, unknown[]>;
  const db = getDb();

  let imported = 0;
  for (const table of IMPORTABLE) {
    const rows = body[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const cols = Object.keys(rows[0] as object);
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`
    );
    const insertMany = db.transaction((items: unknown[]) => {
      for (const row of items) {
        stmt.run(...cols.map((c) => (row as Record<string, unknown>)[c] ?? null));
        imported++;
      }
    });
    insertMany(rows);
  }

  return Response.json({ imported });
}
