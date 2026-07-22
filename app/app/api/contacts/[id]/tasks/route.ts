import { getDb } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { task_id } = await req.json();
  getDb().prepare("INSERT OR IGNORE INTO contact_tasks (contact_id, task_id) VALUES (?, ?)").run(id, task_id);
  return new Response(null, { status: 204 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { task_id } = await req.json();
  getDb().prepare("DELETE FROM contact_tasks WHERE contact_id = ? AND task_id = ?").run(id, task_id);
  return new Response(null, { status: 204 });
}
