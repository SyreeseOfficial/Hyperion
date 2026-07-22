import { getDb } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  getDb().prepare("UPDATE agents SET name = ? WHERE id = ?").run(name.trim(), id);
  return Response.json(getDb().prepare("SELECT * FROM agents WHERE id = ?").get(id));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM agents WHERE id = ?").run(id);
  return new Response(null, { status: 204 });
}
