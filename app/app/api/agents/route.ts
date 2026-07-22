import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const agents = db.prepare(`
    SELECT a.*,
      COUNT(CASE WHEN t.status NOT IN ('done') THEN 1 END) as task_count
    FROM agents a
    LEFT JOIN tasks t ON t.assignee = a.name
    GROUP BY a.id
    ORDER BY a.name
  `).all();
  return Response.json(agents);
}

export async function POST(req: Request) {
  const { name, role, model, parent_id } = await req.json();
  const db = getDb();
  const r = db.prepare(
    "INSERT INTO agents (name, role, model, parent_id) VALUES (?, ?, ?, ?)"
  ).run(name.trim(), role ?? null, model ?? null, parent_id ?? null);
  return Response.json(db.prepare("SELECT * FROM agents WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
