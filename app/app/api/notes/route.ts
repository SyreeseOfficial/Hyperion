import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(getDb().prepare("SELECT * FROM notes ORDER BY created_at DESC").all());
}

export async function POST(req: Request) {
  const { text } = await req.json();
  const db = getDb();
  const r = db.prepare("INSERT INTO notes (text) VALUES (?)").run(String(text).trim());
  return Response.json(db.prepare("SELECT * FROM notes WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}

export async function DELETE() {
  getDb().prepare("DELETE FROM notes").run();
  return new Response(null, { status: 204 });
}
