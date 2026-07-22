import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(
    getDb().prepare("SELECT * FROM contacts ORDER BY name ASC").all()
  );
}

export async function DELETE() {
  getDb().prepare("DELETE FROM contacts").run();
  return new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  const r = db.prepare(
    `INSERT INTO contacts (name, company, email, phone, status)
     VALUES (@name, @company, @email, @phone, @status)`
  ).run({
    name: body.name,
    company: body.company ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    status: body.status ?? "prospect",
  });
  return Response.json(db.prepare("SELECT * FROM contacts WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
