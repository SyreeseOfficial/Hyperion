import { getDb } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  if ("name" in body)      { fields.push("name = ?");      values.push(body.name?.trim() ?? null); }
  if ("role" in body)      { fields.push("role = ?");      values.push(body.role || null); }
  if ("model" in body)     { fields.push("model = ?");     values.push(body.model || null); }
  if ("parent_id" in body) { fields.push("parent_id = ?"); values.push(body.parent_id ?? null); }

  if (fields.length) {
    values.push(id);
    db.prepare(`UPDATE agents SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return Response.json(db.prepare("SELECT * FROM agents WHERE id = ?").get(id));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM agents WHERE id = ?").run(id);
  return new Response(null, { status: 204 });
}
