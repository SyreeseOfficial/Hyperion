"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Plus, Trash2, X, Link, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import PageMotion from "@/components/PageMotion";

type GoalStatus = "active" | "paused" | "complete";

type Goal = {
  id: number;
  title: string;
  description: string | null;
  target_date: string | null;
  status: GoalStatus;
  task_count: number;
  done_count: number;
  created_at: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  goal_id: number | null;
};

const STATUS_COLORS: Record<GoalStatus, string> = {
  active: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  paused: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  complete: "text-warm-gray border-warm-gray/30 bg-warm-gray/10",
};

const BLANK = { title: "", description: "", target_date: "", status: "active" as GoalStatus };

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div
        className="h-full rounded-full bg-gold transition-all duration-300"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);

  function load() {
    fetch("/api/goals").then((r) => r.json()).then(setGoals);
    fetch("/api/tasks").then((r) => r.json()).then(setTasks);
  }

  useEffect(load, []);

  async function loadGoalTasks(goalId: number) {
    const t = await fetch(`/api/goals/${goalId}/tasks`).then((r) => r.json());
    setLinkedTasks(t);
  }

  function openCreate() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }

  function openEdit(g: Goal) {
    setEditing(g);
    setForm({ title: g.title, description: g.description ?? "", target_date: g.target_date ?? "", status: g.status });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      target_date: form.target_date || null,
      status: form.status,
    };
    if (editing) {
      await fetch(`/api/goals/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setOpen(false);
    load();
    setBusy(false);
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    load();
  }

  async function openDetail(g: Goal) {
    setSelected(g);
    await loadGoalTasks(g.id);
  }

  async function linkTask(taskId: number) {
    if (!selected) return;
    await fetch(`/api/goals/${selected.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    });
    await loadGoalTasks(selected.id);
    load();
  }

  async function unlinkTask(taskId: number) {
    if (!selected) return;
    await fetch(`/api/goals/${selected.id}/tasks/${taskId}`, { method: "DELETE" });
    await loadGoalTasks(selected.id);
    load();
  }

  const unlinkedTasks = tasks.filter((t) => !t.goal_id || t.goal_id === selected?.id);
  const availableToLink = unlinkedTasks.filter((t) => !linkedTasks.find((lt) => lt.id === t.id));

  return (
    <PageMotion>
    <div className="p-6 flex flex-col gap-6">
      <SectionHeader
        title="Themis"
        epithet="Divine Law — intentions made concrete"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> New Goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          copy="No law yet written. Set your first intention."
          action={<Button size="sm" onClick={openCreate}><Plus size={14} /> New Goal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = g.task_count > 0 ? (g.done_count / g.task_count) * 100 : 0;
            return (
              <div
                key={g.id}
                className="group relative rounded-lg border border-border bg-obsidian-surface p-4 flex flex-col gap-3 cursor-pointer hover:border-gold-muted transition-colors"
                onClick={() => openDetail(g)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-semibold text-ivory text-sm leading-snug">{g.title}</h3>
                  <Badge className={cn("text-xs shrink-0", STATUS_COLORS[g.status])} variant="outline">
                    {g.status}
                  </Badge>
                </div>

                {g.description && (
                  <p className="text-xs text-warm-gray line-clamp-2">{g.description}</p>
                )}

                <div className="flex flex-col gap-1.5 mt-auto">
                  <div className="flex justify-between text-xs text-warm-gray">
                    <span>{g.done_count}/{g.task_count} tasks</span>
                    {g.target_date && <span>{fmtDate(g.target_date)}</span>}
                  </div>
                  <ProgressBar value={pct} />
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    className="p-1 rounded text-warm-gray hover:text-gold transition-colors"
                    onClick={(e) => { e.stopPropagation(); openEdit(g); }}
                    title="Edit"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    className="p-1 rounded text-warm-gray hover:text-destructive transition-colors"
                    onClick={(e) => { e.stopPropagation(); deleteGoal(g.id); }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Goal" : "New Goal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Title</label>
              <Input
                required
                placeholder="Goal title…"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Description</label>
              <textarea
                className="min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="What does success look like?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Target Date</label>
                <Input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as GoalStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save Changes" : "Create Goal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <Drawer open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DrawerContent className="max-h-[85vh]">
          {selected && (
            <>
              <DrawerHeader className="flex items-start justify-between">
                <div>
                  <DrawerTitle className="font-heading text-gold">{selected.title}</DrawerTitle>
                  {selected.description && <p className="text-sm text-warm-gray mt-1">{selected.description}</p>}
                </div>
                <button className="text-warm-gray hover:text-ivory" onClick={() => setSelected(null)}><X size={18} /></button>
              </DrawerHeader>

              <div className="px-4 pb-6 flex flex-col gap-6 overflow-y-auto">
                {/* Progress */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-warm-gray">
                    <span className="font-medium text-ivory">Progress</span>
                    <span>{selected.done_count}/{selected.task_count} tasks done</span>
                  </div>
                  <ProgressBar value={selected.task_count > 0 ? (selected.done_count / selected.task_count) * 100 : 0} />
                </div>

                {/* Linked tasks */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Linked Tasks</h4>
                  {linkedTasks.length === 0 ? (
                    <p className="text-xs text-warm-gray italic">No tasks linked.</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {linkedTasks.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded hover:bg-obsidian-raised">
                          <span className="text-ivory">{t.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">{t.status.replace("_", " ")}</Badge>
                            <button
                              className="text-warm-gray hover:text-destructive"
                              onClick={() => unlinkTask(t.id)}
                              title="Unlink"
                            >
                              <Unlink size={12} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {availableToLink.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-warm-gray">Link a task:</p>
                      <div className="flex flex-wrap gap-1">
                        {availableToLink.slice(0, 8).map((t) => (
                          <button
                            key={t.id}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:border-gold-muted hover:text-gold transition-colors"
                            onClick={() => linkTask(t.id)}
                          >
                            <Link size={10} /> {t.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
    </PageMotion>
  );
}
