import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(
    getDb().prepare("SELECT * FROM reading_items ORDER BY created_at DESC").all()
  );
}

export async function DELETE() {
  getDb().prepare("DELETE FROM reading_items").run();
  return new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const { url } = await req.json();
  const db = getDb();
  const r = db.prepare(
    "INSERT INTO reading_items (url, status) VALUES (?, 'pending')"
  ).run(url);
  const item = db.prepare("SELECT * FROM reading_items WHERE id = ?").get(r.lastInsertRowid);

  // Fire and forget summarization
  const baseUrl = req.headers.get("origin") ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/reading/${r.lastInsertRowid}/summarize`, { method: "POST" }).catch(() => {});

  return Response.json(item, { status: 201 });
}
