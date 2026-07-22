"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { LayoutDashboard, Zap, CheckSquare, ScrollText, Target, Users, BookOpen, Settings, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  tasks: { id: number; title: string; status: string }[];
  notes: { id: number; text: string; created_at: string }[];
  sessions: { id: number; date: string; provider: string; model: string; summary: string | null }[];
  contacts: { id: number; name: string; company: string | null; status: string }[];
  reading: { id: number; url: string; title: string | null; summary: string | null }[];
};

const NAV = [
  { href: "/", label: "Olympus", icon: LayoutDashboard },
  { href: "/sessions", label: "Prometheus", icon: Zap },
  { href: "/tasks", label: "Hermes", icon: CheckSquare },
  { href: "/notes", label: "Mnemosyne", icon: ScrollText },
  { href: "/goals", label: "Themis", icon: Target },
  { href: "/contacts", label: "Apollo", icon: Users },
  { href: "/reading", label: "Iris", icon: BookOpen },
  { href: "/settings", label: "Hephaestus", icon: Settings },
];

const QUICK_CREATE = [
  { label: "New Task", key: "new-task", section: "/tasks" },
  { label: "Log Session", key: "new-session", section: "/sessions" },
  { label: "New Note", key: "new-note", section: "/notes" },
  { label: "New Contact", key: "new-contact", section: "/contacts" },
  { label: "Save Link", key: "new-reading", section: "/reading" },
  { label: "New Goal", key: "new-goal", section: "/goals" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setResults(null); }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).then(setResults);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
  }, [router]);

  if (!open) return null;

  const hasResults = results && (results.tasks.length + results.notes.length + results.sessions.length + results.contacts.length + results.reading.length) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-obsidian-raised shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search size={14} className="text-warm-gray shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search or navigate…"
              className="flex-1 py-3.5 bg-transparent text-sm text-ivory placeholder:text-warm-gray outline-none"
              autoFocus
            />
            <kbd className="text-xs text-warm-gray border border-border rounded px-1.5 py-0.5">Esc</kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto py-2">
            <Command.Empty className="px-4 py-6 text-center text-sm text-warm-gray">
              {query.length >= 2 ? "No results found." : "Type to search…"}
            </Command.Empty>

            {/* Search results */}
            {hasResults && results.tasks.length > 0 && (
              <Command.Group heading="Tasks" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {results.tasks.map((t) => (
                  <Item key={`t-${t.id}`} onSelect={() => go("/tasks")}>
                    <CheckSquare size={13} className="text-gold shrink-0" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-warm-gray capitalize">{t.status.replace("_", " ")}</span>
                  </Item>
                ))}
              </Command.Group>
            )}
            {hasResults && results.contacts.length > 0 && (
              <Command.Group heading="Contacts" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {results.contacts.map((c) => (
                  <Item key={`c-${c.id}`} onSelect={() => go("/contacts")}>
                    <Users size={13} className="text-amber-400 shrink-0" />
                    <span className="flex-1 truncate">{c.name}{c.company ? ` · ${c.company}` : ""}</span>
                    <span className="text-xs text-warm-gray capitalize">{c.status}</span>
                  </Item>
                ))}
              </Command.Group>
            )}
            {hasResults && results.reading.length > 0 && (
              <Command.Group heading="Reading" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {results.reading.map((r) => (
                  <Item key={`r-${r.id}`} onSelect={() => go("/reading")}>
                    <BookOpen size={13} className="text-pink-400 shrink-0" />
                    <span className="flex-1 truncate">{r.title ?? r.url}</span>
                  </Item>
                ))}
              </Command.Group>
            )}
            {hasResults && results.sessions.length > 0 && (
              <Command.Group heading="Sessions" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {results.sessions.map((s) => (
                  <Item key={`s-${s.id}`} onSelect={() => go("/sessions")}>
                    <Zap size={13} className="text-blue-400 shrink-0" />
                    <span className="flex-1 truncate">{s.provider} · {s.model || s.date}</span>
                    {s.summary && <span className="text-xs text-warm-gray truncate max-w-32">{s.summary}</span>}
                  </Item>
                ))}
              </Command.Group>
            )}
            {hasResults && results.notes.length > 0 && (
              <Command.Group heading="Notes" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {results.notes.map((n) => (
                  <Item key={`n-${n.id}`} onSelect={() => go("/notes")}>
                    <ScrollText size={13} className="text-purple-400 shrink-0" />
                    <span className="flex-1 truncate">{n.text}</span>
                  </Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            {!hasResults && (
              <Command.Group heading="Navigate" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {NAV.map(({ href, label, icon: Icon }) => (
                  <Item key={href} onSelect={() => go(href)}>
                    <Icon size={13} className="text-warm-gray shrink-0" />
                    <span>{label}</span>
                  </Item>
                ))}
              </Command.Group>
            )}

            {/* Quick create */}
            {!hasResults && (
              <Command.Group heading="Quick Create" className="[&>[cmdk-group-heading]]:px-3 [&>[cmdk-group-heading]]:py-1 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:text-warm-gray [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wide">
                {QUICK_CREATE.map(({ label, key, section }) => (
                  <Item key={key} onSelect={() => go(section)}>
                    <Plus size={13} className="text-gold shrink-0" />
                    <span>{label}</span>
                  </Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md text-sm text-ivory cursor-pointer data-[selected=true]:bg-obsidian-surface data-[selected=true]:text-ivory transition-colors"
    >
      {children}
    </Command.Item>
  );
}
