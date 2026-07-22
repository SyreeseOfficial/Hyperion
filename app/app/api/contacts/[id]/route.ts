import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
  if (!contact) return new Response(null, { status: 404 });
  const notes = db.prepare("SELECT * FROM contact_notes WHERE contact_id = ? ORDER BY created_at DESC").all(id);
  const tasks = db.prepare(
    "SELECT t.* FROM tasks t JOIN contact_tasks ct ON ct.task_id = t.id WHERE ct.contact_id = ? ORDER BY t.created_at DESC"
  ).all(id);
  const goals = db.prepare(
    "SELECT g.* FROM goals g JOIN contact_goals cg ON cg.goal_id = g.id WHERE cg.contact_id = ? ORDER BY g.created_at DESC"
  ).all(id);
  return Response.json({ ...contact as object, notes, tasks, goals });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const allowed = ["name", "company", "email", "phone", "status", "last_touched", "notes"];
  const fields = Object.keys(body).filter((k) => allowed.includes(k)).map((k) => `${k} = @${k}`).join(", ");
  if (!fields) return new Response(null, { status: 400 });
  db.prepare(`UPDATE contacts SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({ ...body, id });
  return Response.json(db.prepare("SELECT * FROM contacts WHERE id = ?").get(id));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM contacts WHERE id = ?").run(id);
  return new Response(null, { status: 204 });
}
