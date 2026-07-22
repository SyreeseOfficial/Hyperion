import { getDb } from "@/lib/db";

const SORT_COLS = new Set(["date", "provider", "model", "duration", "tokens_in", "tokens_out", "cost"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const col = SORT_COLS.has(searchParams.get("sort") ?? "") ? searchParams.get("sort") : "date";
  const dir = searchParams.get("order") === "asc" ? "ASC" : "DESC";
  const rows = getDb().prepare(`SELECT * FROM sessions ORDER BY ${col} ${dir}`).all();
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  const r = db.prepare(
    `INSERT INTO sessions (date, provider, model, duration, tokens_in, tokens_out, cost, summary)
     VALUES (@date, @provider, @model, @duration, @tokens_in, @tokens_out, @cost, @summary)`
  ).run(body);
  return Response.json(db.prepare("SELECT * FROM sessions WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
