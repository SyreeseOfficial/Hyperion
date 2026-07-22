import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ tasks: [], notes: [], sessions: [], contacts: [], reading: [] });
  const db = getDb();
  const like = `%${q}%`;

  const tasks = db.prepare("SELECT id, title, status FROM tasks WHERE title LIKE ? LIMIT 5").all(like);
  const notes = db.prepare("SELECT id, text, created_at FROM notes WHERE text LIKE ? LIMIT 5").all(like);
  const sessions = db.prepare("SELECT id, date, provider, model, summary FROM sessions WHERE summary LIKE ? OR model LIKE ? LIMIT 5").all(like, like);
  const contacts = db.prepare("SELECT id, name, company, status FROM contacts WHERE name LIKE ? OR company LIKE ? LIMIT 5").all(like, like);
  const reading = db.prepare("SELECT id, url, title, summary FROM reading_items WHERE title LIKE ? OR summary LIKE ? OR url LIKE ? LIMIT 5").all(like, like, like);

  return Response.json({ tasks, notes, sessions, contacts, reading });
}
