"use client";

import { useState, useEffect, Fragment } from "react";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Session = {
  id: number;
  date: string;
  provider: string;
  model: string;
  duration: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost: number | null;
  summary: string | null;
  created_at: string;
};

type SortKey = "date" | "provider" | "model" | "duration" | "tokens_in" | "tokens_out" | "cost";

const COLS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "provider", label: "Provider" },
  { key: "model", label: "Model" },
  { key: "duration", label: "Duration" },
  { key: "tokens_in", label: "Tokens In" },
  { key: "tokens_out", label: "Tokens Out" },
  { key: "cost", label: "Cost" },
];

const PROVIDERS = ["Claude", "OpenAI", "Gemini", "Other"];

const BLANK = {
  date: new Date().toISOString().split("T")[0],
  provider: "Claude",
  model: "",
  duration: "",
  tokens_in: "",
  tokens_out: "",
  cost: "",
  summary: "",
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtCost(c: number | null) { return c != null ? `$${c.toFixed(4)}` : "—"; }
function fmtNum(n: number | null) { return n != null ? n.toLocaleString() : "—"; }
function fmtDur(m: number | null) {
  if (!m) return "—";
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/sessions?sort=${sort.key}&order=${sort.dir}`)
      .then((r) => r.json())
      .then(setSessions);
  }

  useEffect(load, [sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete(id: number) {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        provider: form.provider,
        model: form.model || null,
        duration: form.duration ? Number(form.duration) : null,
        tokens_in: form.tokens_in ? Number(form.tokens_in) : null,
        tokens_out: form.tokens_out ? Number(form.tokens_out) : null,
        cost: form.cost ? Number(form.cost) : null,
        summary: form.summary || null,
      }),
    });
    setOpen(false);
    setForm(BLANK);
    load();
    setBusy(false);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return <ChevronsUpDown size={12} className="opacity-40" />;
    return sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionHeader
        title="Prometheus"
        epithet="Fire Stolen — every session logged"
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={14} /> Log Session
          </Button>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          copy="No fire stolen yet. Log your first session."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus size={14} /> Log Session
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-obsidian-surface">
                {COLS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-medium text-warm-gray cursor-pointer select-none hover:text-gold transition-colors"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon k={col.key} />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-xs font-medium text-warm-gray">Summary</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    className="group border-b border-border hover:bg-obsidian-raised cursor-pointer transition-colors"
                    onClick={() => toggleExpand(s.id)}
                  >
                    <td className="px-3 py-2 text-ivory whitespace-nowrap">{fmtDate(s.date)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{s.provider}</Badge>
                    </td>
                    <td className="px-3 py-2 text-warm-gray font-mono text-xs">{s.model || "—"}</td>
                    <td className="px-3 py-2 text-warm-gray">{fmtDur(s.duration)}</td>
                    <td className="px-3 py-2 text-warm-gray">{fmtNum(s.tokens_in)}</td>
                    <td className="px-3 py-2 text-warm-gray">{fmtNum(s.tokens_out)}</td>
                    <td className="px-3 py-2 text-gold font-medium">{fmtCost(s.cost)}</td>
                    <td className="px-3 py-2 text-warm-gray max-w-48 truncate">
                      {s.summary ?? "—"}
                    </td>
                    <td
                      className="px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-destructive transition-all"
                        onClick={() => handleDelete(s.id)}
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  {expanded.has(s.id) && (
                    <tr className="border-b border-border bg-obsidian-raised">
                      <td colSpan={9} className="px-4 py-3">
                        <p className="text-sm text-ivory leading-relaxed whitespace-pre-wrap">
                          {s.summary ?? (
                            <span className="italic text-warm-gray">No summary provided.</span>
                          )}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Provider</label>
                <Select
                  value={form.provider}
                  onValueChange={(v) => setForm((f) => ({ ...f, provider: v ?? "Claude" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Model</label>
              <Input
                placeholder="e.g. claude-sonnet-4-6"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Duration (min)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Tokens In</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.tokens_in}
                  onChange={(e) => setForm((f) => ({ ...f, tokens_in: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Tokens Out</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.tokens_out}
                  onChange={(e) => setForm((f) => ({ ...f, tokens_out: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Cost ($)</label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                placeholder="0.0000"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Summary</label>
              <textarea
                className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="What was accomplished in this session..."
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
