import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Record<string, unknown>[];
  const timeSums = db.prepare(
    "SELECT task_id, COALESCE(SUM(minutes), 0) AS total_minutes FROM time_logs WHERE ended_at IS NOT NULL GROUP BY task_id"
  ).all() as { task_id: number; total_minutes: number }[];
  const activeTimers = db.prepare(
    "SELECT task_id, started_at FROM time_logs WHERE ended_at IS NULL ORDER BY started_at DESC"
  ).all() as { task_id: number; started_at: string }[];

  const timeMap = Object.fromEntries(timeSums.map((t) => [t.task_id, t.total_minutes]));
  const timerMap = Object.fromEntries(activeTimers.map((t) => [t.task_id, t.started_at]));

  return Response.json(
    tasks.map((t) => ({
      ...t,
      total_minutes: timeMap[t.id as number] ?? 0,
      active_timer_started_at: timerMap[t.id as number] ?? null,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO tasks (title, status, priority, assignee, due_date, notes, goal_id)
       VALUES (@title, @status, @priority, @assignee, @due_date, @notes, @goal_id)`
    )
    .run({
      title: body.title,
      status: body.status ?? "backlog",
      priority: body.priority ?? "medium",
      assignee: body.assignee ?? null,
      due_date: body.due_date ?? null,
      notes: body.notes ?? null,
      goal_id: body.goal_id ?? null,
    });
  return Response.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(r.lastInsertRowid), { status: 201 });
}
