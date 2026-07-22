import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(
    getDb().prepare("SELECT id, title FROM goals WHERE status != 'complete' ORDER BY title").all()
  );
}
