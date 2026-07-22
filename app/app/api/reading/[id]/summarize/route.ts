import { getDb } from "@/lib/db";

const YT_RE = /(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([^&\s]+)/;

async function getYouTubeText(url: string): Promise<{ title: string; text: string }> {
  const videoId = url.match(YT_RE)?.[1] ?? "";
  const oembed = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  ).then((r) => r.json()).catch(() => ({}));
  const title: string = oembed?.title ?? url;

  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    }).then((r) => r.text());

    const rawMatch = page.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});(?:\s*var|$)/);
    const raw = rawMatch?.[1];
    if (!raw) return { title, text: title };
    const playerData = JSON.parse(raw);
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) return { title, text: title };

    const captionData = await fetch(`${tracks[0].baseUrl}&fmt=json3`).then((r) => r.json());
    const transcript = (captionData.events as Array<{ segs?: Array<{ utf8: string }> }> ?? [])
      .filter((e) => e.segs)
      .flatMap((e) => e.segs!.map((s) => s.utf8))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return { title, text: transcript || title };
  } catch {
    return { title, text: title };
  }
}

async function fetchPageText(url: string): Promise<{ title: string; text: string }> {
  const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? url;
  // Strip tags, collapse whitespace, limit to ~4000 chars for Claude
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
  return { title, text };
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const item = db.prepare("SELECT * FROM reading_items WHERE id = ?").get(id) as { url: string } | undefined;
  if (!item) return new Response(null, { status: 404 });

  const apiKey = (db.prepare("SELECT value FROM settings WHERE key = 'anthropic_api_key'").get() as { value: string } | undefined)?.value;
  if (!apiKey) {
    db.prepare("UPDATE reading_items SET status = 'pending', updated_at = datetime('now') WHERE id = ?").run(id);
    return new Response("No API key", { status: 422 });
  }

  db.prepare("UPDATE reading_items SET status = 'summarizing', updated_at = datetime('now') WHERE id = ?").run(id);

  try {
    const isYT = YT_RE.test(item.url);
    const { title, text } = isYT ? await getYouTubeText(item.url) : await fetchPageText(item.url);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: `Summarize this in one sentence (max 30 words):\n\nTitle: ${title}\n\n${text}`,
          },
        ],
      }),
    }).then((r) => r.json());

    const summary = resp.content?.[0]?.text?.trim() ?? "Could not summarize.";
    db.prepare(
      "UPDATE reading_items SET title = ?, summary = ?, status = 'summarized', updated_at = datetime('now') WHERE id = ?"
    ).run(title, summary, id);
  } catch {
    db.prepare("UPDATE reading_items SET status = 'pending', updated_at = datetime('now') WHERE id = ?").run(id);
  }

  return new Response(null, { status: 204 });
}
