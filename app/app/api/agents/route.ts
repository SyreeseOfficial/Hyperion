import { getDb } from "@/lib/db";

export async function GET() {
  return Response.json(getDb().prepare("SELECT * FROM agents ORDER BY name").all());
}
