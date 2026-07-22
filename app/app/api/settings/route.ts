import { getDb } from "@/lib/db";

export async function GET() {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Response.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function PATCH(req: Request) {
  const updates = await req.json() as Record<string, string>;
  const db = getDb();
  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  for (const [key, value] of Object.entries(updates)) {
    upsert.run(key, value);
  }
  return new Response(null, { status: 204 });
}
