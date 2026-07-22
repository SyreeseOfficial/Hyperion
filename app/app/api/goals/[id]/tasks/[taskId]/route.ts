import { getDb } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  getDb().prepare("UPDATE tasks SET goal_id = NULL WHERE id = ? AND goal_id = ?").run(taskId, id);
  return new Response(null, { status: 204 });
}
