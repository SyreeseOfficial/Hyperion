import { getDb } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const fields = Object.keys(body)
    .filter((k) => ["title", "description", "target_date", "status"].includes(k))
    .map((k) => `${k} = @${k}`)
    .join(", ");
  if (!fields) return new Response(null, { status: 400 });
  db.prepare(`UPDATE goals SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({ ...body, id });
  return Response.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(id));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM goals WHERE id = ?").run(id);
  return new Response(null, { status: 204 });
}
