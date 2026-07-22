import { getDb } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logs = getDb()
    .prepare("SELECT * FROM time_logs WHERE task_id = ? ORDER BY started_at DESC")
    .all(Number(id));
  return Response.json(logs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (body.action === "start") {
    const r = db.prepare("INSERT INTO time_logs (task_id, started_at) VALUES (?, datetime('now'))").run(Number(id));
    const log = db.prepare("SELECT * FROM time_logs WHERE id = ?").get(r.lastInsertRowid);
    return Response.json(log, { status: 201 });
  }

  if (body.action === "stop") {
    const log = db
      .prepare("SELECT * FROM time_logs WHERE task_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1")
      .get(Number(id)) as { id: number; started_at: string } | undefined;
    if (!log) return Response.json({ error: "no active timer" }, { status: 400 });
    const minutes = Math.max(1, Math.round((Date.now() - new Date(log.started_at + "Z").getTime()) / 60000));
    db.prepare("UPDATE time_logs SET ended_at = datetime('now'), minutes = ? WHERE id = ?").run(minutes, log.id);
    return Response.json({ minutes });
  }

  if (body.action === "manual") {
    const mins = Number(body.minutes) || 0;
    db.prepare(
      "INSERT INTO time_logs (task_id, started_at, ended_at, minutes) VALUES (?, datetime('now'), datetime('now'), ?)"
    ).run(Number(id), mins);
    return Response.json({ minutes: mins }, { status: 201 });
  }

  return Response.json({ error: "invalid action" }, { status: 400 });
}
