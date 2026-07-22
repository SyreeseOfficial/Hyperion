import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(
    getDb().prepare("SELECT * FROM tasks WHERE goal_id = ? ORDER BY created_at DESC").all(id)
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { task_id } = await req.json();
  getDb().prepare("UPDATE tasks SET goal_id = ? WHERE id = ?").run(id, task_id);
  return new Response(null, { status: 204 });
}
