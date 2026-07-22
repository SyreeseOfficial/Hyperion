import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const goals = db.prepare(`
    SELECT g.*,
      COUNT(t.id) as task_count,
      COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END), 0) as done_count
    FROM goals g
    LEFT JOIN tasks t ON t.goal_id = g.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `).all();
  return Response.json(goals);
}

export async function DELETE() {
  getDb().prepare("DELETE FROM goals").run();
  return new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  const r = db.prepare(
    `INSERT INTO goals (title, description, target_date, status)
     VALUES (@title, @description, @target_date, @status)`
  ).run({
    title: body.title,
    description: body.description ?? null,
    target_date: body.target_date ?? null,
    status: body.status ?? "active",
  });
  return Response.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
