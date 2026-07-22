import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const timeframe = new URL(req.url).searchParams.get("timeframe") ?? "all";
  const db = getDb();

  let dateFilter = "";
  if (timeframe === "today") dateFilter = "AND date(date) = date('now')";
  else if (timeframe === "week") dateFilter = "AND date(date) >= date('now', '-7 days')";

  const sessions = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(cost),0) as total_cost, COALESCE(SUM(tokens_in),0) as tokens_in, COALESCE(SUM(tokens_out),0) as tokens_out FROM sessions WHERE 1=1 ${dateFilter}`).get() as Record<string, number>;
  const tasks_in_progress = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status = 'in_progress'").get() as { n: number }).n;
  const open_goals = (db.prepare("SELECT COUNT(*) as n FROM goals WHERE status = 'active'").get() as { n: number }).n;
  const hours_logged = (db.prepare("SELECT COALESCE(SUM(minutes),0) as m FROM time_logs WHERE date(started_at) = date('now') AND ended_at IS NOT NULL").get() as { m: number }).m;
  const revenue = (db.prepare("SELECT value FROM settings WHERE key = 'revenue'").get() as { value: string } | undefined)?.value ?? "0";

  return Response.json({
    session_count: sessions.count,
    total_cost: sessions.total_cost,
    tokens_in: sessions.tokens_in,
    tokens_out: sessions.tokens_out,
    tasks_in_progress,
    open_goals,
    hours_logged: Math.round(hours_logged / 60 * 10) / 10,
    revenue: parseFloat(revenue),
  });
}
