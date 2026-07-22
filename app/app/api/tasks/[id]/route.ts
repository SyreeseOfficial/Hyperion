import { getDb } from "@/lib/db";

const ALLOWED = new Set(["title", "status", "priority", "assignee", "due_date", "notes", "goal_id"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields = Object.keys(body).filter((k) => ALLOWED.has(k));
  if (!fields.length) return Response.json({ error: "no valid fields" }, { status: 400 });
  const set = fields.map((f) => `${f} = @${f}`).join(", ");
  const db = getDb();
  db.prepare(`UPDATE tasks SET ${set}, updated_at = datetime('now') WHERE id = @id`).run({ ...body, id: Number(id) });
  return Response.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(id)));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(Number(id));
  return new Response(null, { status: 204 });
}
