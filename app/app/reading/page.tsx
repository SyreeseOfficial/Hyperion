"use client";

import { useState, useEffect, useRef } from "react";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Trash2, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PageMotion from "@/components/PageMotion";

type ReadingStatus = "pending" | "summarizing" | "summarized" | "read" | "archived";

type ReadingItem = {
  id: number;
  url: string;
  title: string | null;
  summary: string | null;
  status: ReadingStatus;
  created_at: string;
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  pending: "text-warm-gray border-warm-gray/30",
  summarizing: "text-blue-400 border-blue-400/30",
  summarized: "text-emerald-400 border-emerald-400/30",
  read: "text-gold border-gold/30",
  archived: "text-warm-gray/50 border-warm-gray/20",
};

const ALL_STATUSES: ReadingStatus[] = ["pending", "summarizing", "summarized", "read", "archived"];

function fmtDate(ts: string) {
  return new Date(ts + "Z").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ReadingPage() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [filter, setFilter] = useState<"all" | ReadingStatus>("all");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  function load() {
    fetch("/api/reading").then((r) => r.json()).then(setItems);
  }

  useEffect(() => {
    load();
    // Poll every 5s while any item is summarizing/pending
    pollingRef.current = setInterval(() => {
      setItems((prev) => {
        const needsPoll = prev.some((i) => i.status === "summarizing" || i.status === "pending");
        if (needsPoll) load();
        return prev;
      });
    }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    const item = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmed }),
    }).then((r) => r.json());
    setItems((prev) => [item, ...prev]);
    setUrl("");
    setBusy(false);
  }

  async function updateStatus(id: number, status: ReadingStatus) {
    await fetch(`/api/reading/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  async function deleteItem(id: number) {
    await fetch(`/api/reading/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const hasSummarizing = items.some((i) => i.status === "summarizing" || i.status === "pending");

  return (
    <PageMotion>
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <SectionHeader
        title="Iris"
        epithet="The Rainbow — messages from the world"
        actions={
          hasSummarizing ? (
            <div className="flex items-center gap-2 text-xs text-warm-gray">
              <Loader2 size={12} className="animate-spin" />
              Summarizing…
            </div>
          ) : undefined
        }
      />

      <form onSubmit={addItem} className="flex gap-2">
        <Input
          type="url"
          placeholder="Paste a URL to save…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={busy || !url.trim()}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : "Save"}
        </Button>
      </form>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {ALL_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs capitalize">{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState copy={filter === "all" ? "The rainbow carries no messages. Save your first link." : `No ${filter} items.`} />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="group flex gap-3 rounded-lg border border-border bg-obsidian-surface px-4 py-3 hover:border-gold-muted/50 transition-colors"
            >
              <BookOpen size={14} className="text-warm-gray shrink-0 mt-1" />

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-ivory hover:text-gold transition-colors truncate flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.title ?? new URL(item.url).hostname}
                    <ExternalLink size={10} className="shrink-0 opacity-60" />
                  </a>
                  <Badge variant="outline" className={cn("text-xs capitalize shrink-0", STATUS_COLORS[item.status])}>
                    {item.status === "summarizing" ? (
                      <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Summarizing</span>
                    ) : item.status}
                  </Badge>
                </div>

                {item.summary ? (
                  <p className="text-xs text-warm-gray leading-relaxed">{item.summary}</p>
                ) : item.status === "pending" ? (
                  <p className="text-xs text-warm-gray italic">Waiting to summarize…</p>
                ) : null}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-warm-gray">{fmtDate(item.created_at)}</span>
                  {item.status !== "read" && item.status !== "archived" && (
                    <button
                      className="text-xs text-warm-gray hover:text-ivory transition-colors"
                      onClick={() => updateStatus(item.id, "read")}
                    >
                      Mark read
                    </button>
                  )}
                  {item.status !== "archived" && (
                    <button
                      className="text-xs text-warm-gray hover:text-ivory transition-colors"
                      onClick={() => updateStatus(item.id, "archived")}
                    >
                      Archive
                    </button>
                  )}
                  {item.status === "archived" && (
                    <button
                      className="text-xs text-warm-gray hover:text-ivory transition-colors"
                      onClick={() => updateStatus(item.id, "pending")}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              <button
                className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-destructive transition-all shrink-0 mt-1"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
    </PageMotion>
  );
}
