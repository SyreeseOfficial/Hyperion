"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, X, Trash2, Phone, Mail, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PageMotion from "@/components/PageMotion";

type ContactStatus = "prospect" | "active" | "cold" | "archived";
type InteractionType = "note" | "call" | "email" | "meeting" | "message";

type Contact = {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: ContactStatus;
  last_touched: string | null;
  created_at: string;
};

type ContactDetail = Contact & {
  notes: ContactNote[];
  tasks: Task[];
  goals: Goal[];
};

type ContactNote = {
  id: number;
  type: InteractionType;
  text: string;
  next_step: string | null;
  created_at: string;
};

type Task = { id: number; title: string; status: string };
type Goal = { id: number; title: string; status: string };

const STATUS_COLORS: Record<ContactStatus, string> = {
  prospect: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  active: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  cold: "text-warm-gray border-warm-gray/30 bg-warm-gray/10",
  archived: "text-warm-gray/50 border-warm-gray/20 bg-warm-gray/5",
};

const STATUSES: ContactStatus[] = ["prospect", "active", "cold", "archived"];
const INTERACTION_TYPES: InteractionType[] = ["note", "call", "email", "meeting", "message"];

const BLANK_CONTACT = { name: "", company: "", email: "", phone: "", status: "prospect" as ContactStatus };
const BLANK_LOG = { type: "note" as InteractionType, text: "", next_step: "", structured: false };

function fmtDate(ts: string) {
  return new Date(ts + (ts.includes("T") ? "Z" : "")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | ContactStatus>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK_CONTACT);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [logForm, setLogForm] = useState(BLANK_LOG);
  const [loggingBusy, setLoggingBusy] = useState(false);

  function load() {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
  }

  useEffect(load, []);

  async function loadDetail(id: number) {
    const d = await fetch(`/api/contacts/${id}`).then((r) => r.json());
    setDetail(d);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        company: form.company || null,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
      }),
    });
    setOpen(false);
    setForm(BLANK_CONTACT);
    load();
    setBusy(false);
  }

  async function deleteContact(id: number) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
    if (detail?.id === id) setDetail(null);
  }

  async function updateStatus(id: number, status: ContactStatus) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    if (detail?.id === id) await loadDetail(id);
  }

  async function logInteraction(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !logForm.text.trim()) return;
    setLoggingBusy(true);
    await fetch(`/api/contacts/${detail.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: logForm.type,
        text: logForm.text,
        next_step: logForm.next_step || null,
      }),
    });
    setLogForm(BLANK_LOG);
    await loadDetail(detail.id);
    load();
    setLoggingBusy(false);
  }

  async function deleteNote(noteId: number) {
    if (!detail) return;
    await fetch(`/api/contacts/${detail.id}/notes/${noteId}`, { method: "DELETE" });
    await loadDetail(detail.id);
  }

  const filtered = statusFilter === "all" ? contacts : contacts.filter((c) => c.status === statusFilter);

  return (
    <PageMotion>
    <div className="p-6 flex flex-col gap-6">
      <SectionHeader
        title="Apollo"
        epithet="The Oracle — know your people"
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={14} /> New Contact
          </Button>
        }
      />

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs capitalize">{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          copy={statusFilter === "all" ? "No souls yet known. Who will you track?" : `No ${statusFilter} contacts.`}
          action={statusFilter === "all" ? <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> New Contact</Button> : undefined}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-obsidian-surface">
                <th className="px-4 py-2 text-left text-xs font-medium text-warm-gray">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-warm-gray">Company</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-warm-gray">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-warm-gray">Last Touched</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="group border-b border-border hover:bg-obsidian-raised cursor-pointer transition-colors last:border-0"
                  onClick={() => loadDetail(c.id)}
                >
                  <td className="px-4 py-3 text-ivory font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-warm-gray">
                    {c.company ? (
                      <span className="flex items-center gap-1.5"><Building2 size={12} />{c.company}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs capitalize", STATUS_COLORS[c.status])}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-warm-gray text-xs">
                    {c.last_touched ? fmtDate(c.last_touched) : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-destructive transition-all"
                      onClick={() => deleteContact(c.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create contact modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-warm-gray">Name</label>
              <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Company</label>
                <Input placeholder="Company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ContactStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Email</label>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-warm-gray">Phone</label>
                <Input type="tel" placeholder="+1 555…" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add Contact"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <Drawer open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DrawerContent className="max-h-[90vh]">
          {detail && (
            <>
              <DrawerHeader className="flex items-start justify-between border-b border-border pb-4">
                <div className="flex flex-col gap-1">
                  <DrawerTitle className="font-heading text-gold text-xl">{detail.name}</DrawerTitle>
                  <div className="flex items-center gap-3 text-sm text-warm-gray">
                    {detail.company && <span className="flex items-center gap-1"><Building2 size={12} />{detail.company}</span>}
                    {detail.email && <span className="flex items-center gap-1"><Mail size={12} />{detail.email}</span>}
                    {detail.phone && <span className="flex items-center gap-1"><Phone size={12} />{detail.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v as ContactStatus)}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button className="text-warm-gray hover:text-ivory ml-2" onClick={() => setDetail(null)}><X size={18} /></button>
                </div>
              </DrawerHeader>

              <div className="overflow-y-auto px-4 pb-6 flex flex-col gap-6 mt-4">
                {/* Log interaction */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Log Interaction</h4>
                  <form onSubmit={logInteraction} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Select value={logForm.type} onValueChange={(v) => setLogForm((f) => ({ ...f, type: v as InteractionType }))}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INTERACTION_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize text-xs">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1 h-8 text-sm"
                        placeholder="What happened?"
                        value={logForm.text}
                        onChange={(e) => setLogForm((f) => ({ ...f, text: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1 h-8 text-sm"
                        placeholder="Next step (optional)"
                        value={logForm.next_step}
                        onChange={(e) => setLogForm((f) => ({ ...f, next_step: e.target.value }))}
                      />
                      <Button type="submit" size="sm" disabled={loggingBusy || !logForm.text.trim()}>Log</Button>
                    </div>
                  </form>
                </div>

                {/* Interaction log */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide">History</h4>
                  {detail.notes.length === 0 ? (
                    <p className="text-xs text-warm-gray italic">No interactions logged.</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {detail.notes.map((n) => (
                        <li key={n.id} className="group flex gap-3 px-2 py-2 rounded hover:bg-obsidian-raised">
                          <Badge variant="outline" className="text-xs capitalize shrink-0 h-5 mt-0.5">{n.type}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ivory">{n.text}</p>
                            {n.next_step && <p className="text-xs text-gold mt-0.5">→ {n.next_step}</p>}
                            <p className="text-xs text-warm-gray mt-0.5">{fmtDate(n.created_at)}</p>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 text-warm-gray hover:text-destructive shrink-0"
                            onClick={() => deleteNote(n.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Linked tasks */}
                {detail.tasks.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Linked Tasks</h4>
                    <ul className="flex flex-col gap-1">
                      {detail.tasks.map((t) => (
                        <li key={t.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-obsidian-raised">
                          <span className="text-ivory">{t.title}</span>
                          <Badge variant="outline" className="text-xs">{t.status.replace("_", " ")}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Linked goals */}
                {detail.goals.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Linked Goals</h4>
                    <ul className="flex flex-col gap-1">
                      {detail.goals.map((g) => (
                        <li key={g.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-obsidian-raised">
                          <span className="text-ivory">{g.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{g.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
    </PageMotion>
  );
}
