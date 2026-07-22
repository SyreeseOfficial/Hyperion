"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
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
import PageMotion from "@/components/PageMotion";
import { cn } from "@/lib/utils";

type Agent = {
  id: number;
  name: string;
  role: string | null;
  model: string | null;
  parent_id: number | null;
  task_count: number;
};

function getDescendantIds(agents: Agent[], id: number): Set<number> {
  const result = new Set<number>();
  const queue = [id];
  while (queue.length) {
    const curr = queue.shift()!;
    for (const a of agents) {
      if (a.parent_id === curr && !result.has(a.id)) {
        result.add(a.id);
        queue.push(a.id);
      }
    }
  }
  return result;
}

function RootDropZone({ draggingId }: { draggingId: number | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root-drop", disabled: !draggingId });
  if (!draggingId) return null;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-6 border border-dashed rounded-lg p-3 text-center text-xs transition-colors",
        isOver ? "border-gold text-gold bg-gold/5" : "border-border/50 text-warm-gray"
      )}
    >
      Drop here to make top-level
    </div>
  );
}

function AgentCard({
  agent,
  allAgents,
  draggingId,
  onEdit,
}: {
  agent: Agent;
  allAgents: Agent[];
  draggingId: number | null;
  onEdit: (a: Agent) => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging, transform } = useDraggable({ id: agent.id });

  const descendants = draggingId ? getDescendantIds(allAgents, draggingId) : new Set<number>();
  const dropDisabled = !draggingId || draggingId === agent.id || descendants.has(agent.id);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${agent.id}`, disabled: dropDisabled });

  function setRef(el: HTMLElement | null) {
    setDragRef(el);
    setDropRef(el);
  }

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setRef}
      style={style}
      className={cn(
        "relative w-44 rounded-lg border p-3 bg-obsidian-surface transition-all select-none",
        isDragging ? "opacity-40 z-50" : "z-10",
        isOver && !dropDisabled ? "border-gold ring-1 ring-gold/30" : "border-border hover:border-gold/40"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 cursor-grab active:cursor-grabbing text-warm-gray/40 hover:text-warm-gray"
      >
        <GripVertical size={12} />
      </div>

      <div className="font-heading text-sm font-semibold text-gold pr-5 leading-tight">{agent.name}</div>

      {agent.role && (
        <Badge variant="secondary" className="mt-1.5 text-xs h-4 px-1.5">{agent.role}</Badge>
      )}

      {agent.model && (
        <div className="text-xs text-warm-gray mt-1 truncate">{agent.model}</div>
      )}

      {agent.task_count > 0 && (
        <div className="text-xs text-warm-gray/60 mt-1">
          {agent.task_count} open task{agent.task_count !== 1 ? "s" : ""}
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
        className="mt-2 text-xs text-warm-gray/60 hover:text-gold transition-colors"
      >
        Edit
      </button>
    </div>
  );
}

function OrgBranch({
  agent,
  allAgents,
  draggingId,
  onEdit,
}: {
  agent: Agent;
  allAgents: Agent[];
  draggingId: number | null;
  onEdit: (a: Agent) => void;
}) {
  const children = allAgents.filter((a) => a.parent_id === agent.id);

  return (
    <div className="flex flex-col items-center">
      <AgentCard agent={agent} allAgents={allAgents} draggingId={draggingId} onEdit={onEdit} />
      {children.length > 0 && (
        <>
          <div className="w-px h-6 bg-gold-muted" />
          <div className="org-level">
            {children.map((child) => (
              <div key={child.id} className="org-item">
                <div className="w-px h-6 bg-gold-muted" />
                <OrgBranch agent={child} allAgents={allAgents} draggingId={draggingId} onEdit={onEdit} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY_FORM = { name: "", role: "", model: "" };

export default function PantheonPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);

  function loadAgents() {
    fetch("/api/agents").then((r) => r.json()).then(setAgents);
  }

  useEffect(() => { loadAgents(); }, []);

  function openEdit(agent: Agent) {
    setEditing(agent);
    setEditForm({ name: agent.name, role: agent.role ?? "", model: agent.model ?? "" });
  }

  async function saveEdit() {
    if (!editing) return;
    await fetch(`/api/agents/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        role: editForm.role.trim() || null,
        model: editForm.model.trim() || null,
      }),
    });
    setEditing(null);
    loadAgents();
  }

  async function deleteAgent() {
    if (!editing) return;
    await fetch(`/api/agents/${editing.id}`, { method: "DELETE" });
    setEditing(null);
    loadAgents();
  }

  async function addAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name.trim(),
        role: addForm.role.trim() || null,
        model: addForm.model.trim() || null,
      }),
    });
    setAdding(false);
    setAddForm(EMPTY_FORM);
    loadAgents();
  }

  function handleDragStart(e: DragStartEvent) {
    setDraggingId(e.active.id as number);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;

    const draggedId = active.id as number;
    const overId = String(over.id);

    let newParentId: number | null = null;
    if (overId === "root-drop") {
      newParentId = null;
    } else if (overId.startsWith("drop-")) {
      newParentId = parseInt(overId.slice(5));
    } else {
      return;
    }

    if (newParentId === draggedId) return;
    if (newParentId !== null && getDescendantIds(agents, draggedId).has(newParentId)) return;
    if (agents.find((a) => a.id === draggedId)?.parent_id === newParentId) return;

    await fetch(`/api/agents/${draggedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_id: newParentId }),
    });
    loadAgents();
  }

  const roots = agents.filter((a) => !a.parent_id);

  return (
    <PageMotion>
      <div className="p-6">
        <SectionHeader
          title="Pantheon"
          epithet="The Council"
          actions={
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus size={14} className="mr-1" /> Add Agent
            </Button>
          }
        />

        <div className="mt-6">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {agents.length === 0 ? (
              <EmptyState
                copy="No agents in the council yet. Add your first divine operative."
                action={<Button onClick={() => setAdding(true)}>Add Agent</Button>}
              />
            ) : (
              <>
                <RootDropZone draggingId={draggingId} />
                <div className="overflow-auto pb-8">
                  <div className="flex gap-16 justify-center min-w-fit pt-2">
                    {roots.map((root) => (
                      <OrgBranch
                        key={root.id}
                        agent={root}
                        allAgents={agents}
                        draggingId={draggingId}
                        onEdit={openEdit}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </DndContext>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Role (e.g. Research Bot)"
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
            />
            <Input
              placeholder="Model (e.g. Claude Sonnet 4.6)"
              value={editForm.model}
              onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button variant="destructive" size="sm" onClick={deleteAgent}>Delete</Button>
              <Button onClick={saveEdit}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Add Agent</DialogTitle>
          </DialogHeader>
          <form onSubmit={addAgent} className="space-y-3 py-2">
            <Input
              placeholder="Name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
            <Input
              placeholder="Role (e.g. Research Bot)"
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
            />
            <Input
              placeholder="Model (e.g. Claude Sonnet 4.6)"
              value={addForm.model}
              onChange={(e) => setAddForm((f) => ({ ...f, model: e.target.value }))}
            />
            <DialogFooter>
              <Button type="submit">Add Agent</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
