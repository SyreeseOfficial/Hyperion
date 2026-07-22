import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(getDb().prepare("SELECT * FROM briefings ORDER BY created_at DESC LIMIT 1").get() ?? null);
}

export async function POST(req: Request) {
  const { content } = await req.json();
  const db = getDb();
  db.prepare("DELETE FROM briefings").run();
  const r = db.prepare("INSERT INTO briefings (content) VALUES (?)").run(content);
  return Response.json(db.prepare("SELECT * FROM briefings WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
