import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const sessions = db.prepare("SELECT id, 'session' as type, 'Session logged' as label, created_at FROM sessions ORDER BY created_at DESC LIMIT 10").all();
  const tasks = db.prepare("SELECT id, 'task' as type, ('Task: ' || title) as label, updated_at as created_at FROM tasks ORDER BY updated_at DESC LIMIT 10").all();
  const notes = db.prepare("SELECT id, 'note' as type, 'Note added' as label, created_at FROM notes ORDER BY created_at DESC LIMIT 10").all();
  const goals = db.prepare("SELECT id, 'goal' as type, ('Goal: ' || title) as label, updated_at as created_at FROM goals ORDER BY updated_at DESC LIMIT 10").all();
  const contacts = db.prepare("SELECT id, 'contact' as type, ('Contact: ' || name) as label, updated_at as created_at FROM contacts WHERE last_touched IS NOT NULL ORDER BY updated_at DESC LIMIT 10").all();
  const reading = db.prepare("SELECT id, 'reading' as type, COALESCE(title, url) as label, created_at FROM reading_items ORDER BY created_at DESC LIMIT 10").all();

  const all = [...sessions, ...tasks, ...notes, ...goals, ...contacts, ...reading] as Array<{ created_at: string; type: string; label: string }>;
  all.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return Response.json(all.slice(0, 30));
}
