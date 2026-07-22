"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Plus,
  Play,
  Square,
  Archive,
  ChevronDown,
  ChevronUp,
  Trash2,
  Timer,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = "backlog" | "todo" | "in_progress" | "done";
type Priority = "low" | "medium" | "high";

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  due_date: string | null;
  notes: string | null;
  goal_id: number | null;
  total_minutes: number;
  active_timer_started_at: string | null;
  created_at: string;
};

type ArchivedTask = {
  id: number;
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  archived_at: string;
};

type Agent = { id: number; name: string };
type Goal = { id: number; title: string };
type TimeLog = { id: number; started_at: string; ended_at: string | null; minutes: number | null };

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

const BLANK_TASK = {
  title: "",
  status: "backlog" as TaskStatus,
  priority: "medium" as Priority,
  assignee: "",
  due_date: "",
  notes: "",
  goal_id: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMinutes(m: number) {
  if (!m) return "0m";
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function elapsedMinutes(startedAt: string) {
  return Math.round((Date.now() - new Date(startedAt + "Z").getTime()) / 60000);
}

// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  goals,
  onStatusChange,
  onArchive,
  onDelete,
  onTimerToggle,
  onTotalUpdate,
  isDragOverlay = false,
}: {
  task: Task;
  goals: Goal[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onTimerToggle: (id: number, running: boolean) => void;
  onTotalUpdate: (id: number, minutes: number) => void;
  isDragOverlay?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [manualMin, setManualMin] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = !!task.active_timer_started_at;

  // Keep elapsed counter ticking when timer is active
  useEffect(() => {
    if (isRunning && task.active_timer_started_at) {
      setElapsed(elapsedMinutes(task.active_timer_started_at));
      intervalRef.current = setInterval(() => {
        setElapsed(elapsedMinutes(task.active_timer_started_at!));
      }, 30000); // update every 30s
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, task.active_timer_started_at]);

  async function loadLogs() {
    const logs = await fetch(`/api/tasks/${task.id}/time`).then((r) => r.json());
    setTimeLogs(logs);
  }

  async function toggleTimer() {
    if (isRunning) {
      const { minutes } = await fetch(`/api/tasks/${task.id}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      }).then((r) => r.json());
      onTimerToggle(task.id, false);
      onTotalUpdate(task.id, task.total_minutes + minutes);
    } else {
      await fetch(`/api/tasks/${task.id}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      onTimerToggle(task.id, true);
    }
  }

  async function addManualTime(e: React.FormEvent) {
    e.preventDefault();
    const mins = Number(manualMin);
    if (!mins || mins <= 0) return;
    await fetch(`/api/tasks/${task.id}/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "manual", minutes: mins }),
    });
    onTotalUpdate(task.id, task.total_minutes + mins);
    setManualMin("");
    loadLogs();
  }

  const goalTitle = goals.find((g) => g.id === task.goal_id)?.title;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-obsidian-surface p-3 flex flex-col gap-2 text-sm",
        isDragOverlay && "shadow-lg ring-1 ring-gold/30 rotate-1"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <p className="flex-1 font-medium text-ivory leading-snug">{task.title}</p>
        <button
          className="text-warm-gray hover:text-destructive transition-colors shrink-0 mt-0.5"
          onClick={() => onDelete(task.id)}
          title="Delete task"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {task.assignee && (
          <Badge variant="outline" className="text-xs">
            {task.assignee}
          </Badge>
        )}
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            PRIORITY_STYLES[task.priority]
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-warm-gray">
        {task.due_date && <span>Due {fmtDate(task.due_date)}</span>}
        <span className="flex items-center gap-1">
          <Timer size={11} />
          {isRunning
            ? `${fmtMinutes(task.total_minutes)} + ${elapsed}m`
            : fmtMinutes(task.total_minutes)}
        </span>
        {goalTitle && <span className="truncate max-w-24" title={goalTitle}>↗ {goalTitle}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {/* Status select (fallback for no-drag) */}
        <Select
          value={task.status}
          onValueChange={(v) => v && onStatusChange(task.id, v as TaskStatus)}
        >
          <SelectTrigger size="sm" className="h-6 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Timer */}
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-md border px-2 h-6 text-xs transition-colors",
            isRunning
              ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border-border text-warm-gray hover:text-gold hover:border-gold/30"
          )}
          onClick={toggleTimer}
          title={isRunning ? "Stop timer" : "Start timer"}
        >
          {isRunning ? <Square size={10} /> : <Play size={10} />}
        </button>

        {/* Archive (done only) */}
        {task.status === "done" && (
          <button
            className="inline-flex items-center justify-center rounded-md border border-border h-6 px-2 text-xs text-warm-gray hover:text-gold hover:border-gold/30 transition-colors"
            onClick={() => onArchive(task.id)}
            title="Archive task"
          >
            <Archive size={10} />
          </button>
        )}

        {/* Expand toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md h-6 w-6 text-warm-gray hover:text-ivory transition-colors"
          onClick={() => {
            setExpanded((e) => !e);
            if (!expanded) loadLogs();
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="flex flex-col gap-2 pt-1 border-t border-border">
          {task.notes && (
            <p className="text-xs text-warm-gray whitespace-pre-wrap leading-relaxed">{task.notes}</p>
          )}

          {/* Time logs */}
          {timeLogs.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {timeLogs.map((log) => (
                <li key={log.id} className="text-xs text-warm-gray flex justify-between">
                  <span>
                    {new Date(log.started_at + "Z").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>{log.minutes != null ? fmtMinutes(log.minutes) : "running…"}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Manual time entry */}
          <form onSubmit={addManualTime} className="flex gap-1.5">
            <Input
              type="number"
              min="1"
              placeholder="min"
              value={manualMin}
              onChange={(e) => setManualMin(e.target.value)}
              className="h-6 text-xs flex-1"
            />
            <Button type="submit" size="sm" className="h-6 text-xs px-2">
              + Log
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Draggable Card Wrapper ───────────────────────────────────────────────────

function DraggableCard(props: Parameters<typeof TaskCard>[0]) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.task.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <TaskCard {...props} />
    </div>
  );
}

// ─── Column ──────────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  goals,
  onStatusChange,
  onArchive,
  onDelete,
  onTimerToggle,
  onTotalUpdate,
  onClearDone,
}: {
  col: { id: TaskStatus; label: string };
  tasks: Task[];
  goals: Goal[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onTimerToggle: (id: number, running: boolean) => void;
  onTotalUpdate: (id: number, minutes: number) => void;
  onClearDone: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col gap-2 min-w-60 w-60 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-warm-gray uppercase tracking-wide">
            {col.label}
          </span>
          <span className="text-xs text-warm-gray/60 tabular-nums">{tasks.length}</span>
        </div>
        {col.id === "done" && tasks.length > 0 && (
          <button
            className="text-xs text-warm-gray hover:text-gold transition-colors"
            onClick={onClearDone}
          >
            Archive all
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-32 rounded-lg p-2 transition-colors",
          isOver ? "bg-gold-glow/20 border border-dashed border-gold/30" : "bg-obsidian-raised/30"
        )}
      >
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            goals={goals}
            onStatusChange={onStatusChange}
            onArchive={onArchive}
            onDelete={onDelete}
            onTimerToggle={onTimerToggle}
            onTotalUpdate={onTotalUpdate}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-xs text-warm-gray/40 py-4 italic">Empty</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [archived, setArchived] = useState<ArchivedTask[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Filters
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "">("");

  // Modals
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [form, setForm] = useState(BLANK_TASK);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function loadTasks() {
    fetch("/api/tasks").then((r) => r.json()).then(setTasks);
  }

  function loadArchived() {
    fetch("/api/tasks/archived").then((r) => r.json()).then(setArchived);
  }

  useEffect(() => {
    loadTasks();
    fetch("/api/agents").then((r) => r.json()).then(setAgents);
    fetch("/api/goals").then((r) => r.json()).then(setGoals);
  }, []);

  // ── DnD handlers ──
  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  // ── Task mutations ──
  function updateStatus(id: number, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function archiveTask(id: number) {
    fetch(`/api/tasks/${id}/archive`, { method: "POST" }).then(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  }

  async function archiveAllDone() {
    const done = tasks.filter((t) => t.status === "done");
    await Promise.all(done.map((t) => fetch(`/api/tasks/${t.id}/archive`, { method: "POST" })));
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
  }

  function deleteTask(id: number) {
    fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleTimerToggle(id: number, running: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, active_timer_started_at: running ? new Date().toISOString().replace("Z", "") : null }
          : t
      )
    );
  }

  function handleTotalUpdate(id: number, minutes: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, total_minutes: minutes } : t)));
  }

  // ── Create task ──
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const task: Task = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        status: form.status,
        priority: form.priority,
        assignee: form.assignee || null,
        due_date: form.due_date || null,
        notes: form.notes || null,
        goal_id: form.goal_id ? Number(form.goal_id) : null,
      }),
    }).then((r) => r.json());
    setTasks((prev) => [{ ...task, total_minutes: 0, active_timer_started_at: null }, ...prev]);
    setNewTaskOpen(false);
    setForm(BLANK_TASK);
    setBusy(false);
  }

  // ── Archive panel ──
  async function openArchive() {
    loadArchived();
    setArchiveOpen(true);
  }

  async function deleteArchived(id: number) {
    await fetch(`/api/tasks/archived/${id}`, { method: "DELETE" });
    setArchived((prev) => prev.filter((a) => a.id !== id));
  }

  async function deleteAllArchived() {
    await fetch("/api/tasks/archived", { method: "DELETE" });
    setArchived([]);
  }

  // ── Filtering ──
  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee && t.assignee !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const assigneeOptions = [...new Set(tasks.map((t) => t.assignee).filter(Boolean) as string[])];

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <SectionHeader
        title="Hermes"
        epithet="The Messenger — tasks in flight"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openArchive}>
              <Archive size={14} /> Archive
            </Button>
            <Button size="sm" onClick={() => setNewTaskOpen(true)}>
              <Plus size={14} /> New Task
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filterAssignee}
          onValueChange={(v) => setFilterAssignee(v ?? "")}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All assignees</SelectItem>
            <SelectItem value="Me">Me</SelectItem>
            {assigneeOptions.filter((a) => a !== "Me").map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPriority}
          onValueChange={(v) => setFilterPriority((v as Priority | "") ?? "")}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        {(filterAssignee || filterPriority) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterAssignee(""); setFilterPriority(""); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Board */}
      {tasks.length === 0 ? (
        <EmptyState
          copy="The board is clear. What does the messenger carry?"
          action={
            <Button size="sm" onClick={() => setNewTaskOpen(true)}>
              <Plus size={14} /> New Task
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={filteredTasks.filter((t) => t.status === col.id)}
                goals={goals}
                onStatusChange={updateStatus}
                onArchive={archiveTask}
                onDelete={deleteTask}
                onTimerToggle={handleTimerToggle}
                onTotalUpdate={handleTotalUpdate}
                onClearDone={archiveAllDone}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                goals={goals}
                onStatusChange={() => {}}
                onArchive={() => {}}
                onDelete={() => {}}
                onTimerToggle={() => {}}
                onTotalUpdate={() => {}}
                isDragOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* New Task Modal */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Title</label>
              <Input
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as TaskStatus }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Priority</label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, priority: v as Priority }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Assignee</label>
                <Select
                  value={form.assignee}
                  onValueChange={(v) => setForm((f) => ({ ...f, assignee: v ?? "" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    <SelectItem value="Me">Me</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Due date</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
            </div>

            {goals.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Linked goal</label>
                <Select
                  value={form.goal_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, goal_id: v ?? "" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No goal</SelectItem>
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Notes</label>
              <textarea
                className="min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="Optional notes…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={busy || !form.title.trim()}>
                {busy ? "Creating…" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Drawer */}
      <Drawer open={archiveOpen} onOpenChange={setArchiveOpen} swipeDirection="right">
        <DrawerContent className="overflow-y-auto">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle>Archived Tasks</DrawerTitle>
            <div className="flex items-center gap-2">
              {archived.length > 0 && (
                <Button variant="destructive" size="sm" onClick={deleteAllArchived}>
                  Delete all
                </Button>
              )}
              <DrawerClose render={<Button variant="ghost" size="icon-sm" />}>
                <X size={16} />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="p-4 flex flex-col gap-2">
            {archived.length === 0 ? (
              <p className="text-sm text-warm-gray italic text-center py-8">No archived tasks.</p>
            ) : (
              archived.map((a) => (
                <div
                  key={a.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-obsidian-raised transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ivory truncate">{a.title}</p>
                    <p className="text-xs text-warm-gray">
                      {new Date(a.archived_at + "Z").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-destructive transition-all"
                    onClick={() => deleteArchived(a.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
