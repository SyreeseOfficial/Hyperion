import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(
    getDb().prepare("SELECT * FROM contact_notes WHERE contact_id = ? ORDER BY created_at DESC").all(id)
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const r = db.prepare(
    `INSERT INTO contact_notes (contact_id, type, text, next_step) VALUES (@contact_id, @type, @text, @next_step)`
  ).run({ contact_id: id, type: body.type ?? "note", text: body.text, next_step: body.next_step ?? null });
  db.prepare("UPDATE contacts SET last_touched = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id);
  return Response.json(db.prepare("SELECT * FROM contact_notes WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
