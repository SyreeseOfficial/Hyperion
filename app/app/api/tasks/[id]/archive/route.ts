import { getDb } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(id)) as Record<string, unknown> | undefined;
  if (!task) return Response.json({ error: "not found" }, { status: 404 });
  db.prepare(
    `INSERT INTO archived_tasks (title, status, priority, assignee, due_date, notes, goal_id, created_at)
     VALUES (@title, @status, @priority, @assignee, @due_date, @notes, @goal_id, @created_at)`
  ).run(task);
  db.prepare("DELETE FROM tasks WHERE id = ?").run(Number(id));
  return new Response(null, { status: 204 });
}
