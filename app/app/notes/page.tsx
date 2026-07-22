"use client";

import { useState, useEffect, useRef } from "react";
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
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = { id: number; text: string; created_at: string };

function fmtTime(ts: string) {
  return new Date(ts + "Z").toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then(setNotes);
  }, []);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const note: Note = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then((r) => r.json());
    setNotes((prev) => [note, ...prev]);
    setInput("");
    inputRef.current?.focus();
  }

  async function deleteNote(id: number) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  async function clearAll() {
    await fetch("/api/notes", { method: "DELETE" });
    setNotes([]);
    setConfirmClear(false);
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <SectionHeader
        title="Mnemosyne"
        epithet="Memory — what must not be forgotten"
        actions={
          notes.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
              Clear all
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={addNote} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What must not be forgotten…"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!input.trim()}>
          Add
        </Button>
      </form>

      {notes.length === 0 ? (
        <EmptyState copy="Memory has no entries. What must not be forgotten?" />
      ) : (
        <ul className="flex flex-col gap-0.5">
          {notes.map((note) => (
            <li
              key={note.id}
              className={cn(
                "group flex items-start gap-3 px-3 py-2.5 rounded-md",
                "hover:bg-obsidian-raised transition-colors"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ivory leading-relaxed whitespace-pre-wrap break-words">
                  {note.text}
                </p>
                <p className="text-xs text-warm-gray mt-0.5">{fmtTime(note.created_at)}</p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 mt-0.5 text-warm-gray hover:text-destructive transition-all shrink-0"
                onClick={() => deleteNote(note.id)}
                title="Delete note"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notes?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-warm-gray">
            This will permanently delete all {notes.length} note{notes.length !== 1 ? "s" : ""}. This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAll}>
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
