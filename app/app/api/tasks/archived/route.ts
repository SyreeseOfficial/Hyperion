import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(getDb().prepare("SELECT * FROM archived_tasks ORDER BY archived_at DESC").all());
}

export async function DELETE() {
  getDb().prepare("DELETE FROM archived_tasks").run();
  return new Response(null, { status: 204 });
}
