import { getDb } from "@/lib/db";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM archived_tasks WHERE id = ?").run(Number(id));
  return new Response(null, { status: 204 });
}
