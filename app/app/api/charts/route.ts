import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const cost = db.prepare(
    "SELECT date, COALESCE(SUM(cost),0) as cost FROM sessions GROUP BY date ORDER BY date ASC LIMIT 30"
  ).all();

  const tokens = db.prepare(
    "SELECT date, COALESCE(SUM(tokens_in),0) as tokens_in, COALESCE(SUM(tokens_out),0) as tokens_out FROM sessions GROUP BY date ORDER BY date ASC LIMIT 30"
  ).all();

  const tasks = db.prepare(
    "SELECT date(updated_at) as date, COUNT(*) as count FROM tasks WHERE status = 'done' GROUP BY date(updated_at) ORDER BY date ASC LIMIT 30"
  ).all();

  return Response.json({ cost, tokens, tasks });
}
