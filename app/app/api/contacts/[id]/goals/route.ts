import { getDb } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { goal_id } = await req.json();
  getDb().prepare("INSERT OR IGNORE INTO contact_goals (contact_id, goal_id) VALUES (?, ?)").run(id, goal_id);
  return new Response(null, { status: 204 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { goal_id } = await req.json();
  getDb().prepare("DELETE FROM contact_goals WHERE contact_id = ? AND goal_id = ?").run(id, goal_id);
  return new Response(null, { status: 204 });
}
