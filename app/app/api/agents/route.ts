import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(getDb().prepare("SELECT * FROM agents ORDER BY name").all());
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const db = getDb();
  const r = db.prepare("INSERT INTO agents (name) VALUES (?)").run(name.trim());
  return Response.json(db.prepare("SELECT * FROM agents WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
