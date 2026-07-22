import { getDb } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;
  getDb().prepare("DELETE FROM contact_notes WHERE id = ?").run(noteId);
  return new Response(null, { status: 204 });
}
