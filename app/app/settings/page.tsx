"use client";

import { useState, useEffect, useRef } from "react";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
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
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Download, Upload, Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import PageMotion from "@/components/PageMotion";

type Agent = { id: number; name: string };

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: "Open command palette" },
  { keys: ["Esc"], label: "Close palette / cancel edit" },
  { keys: ["Enter"], label: "Confirm inline edit" },
  { keys: ["↑", "↓"], label: "Navigate palette results" },
];

export default function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newAgent, setNewAgent] = useState("");
  const [editingAgent, setEditingAgent] = useState<{ id: number; name: string } | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [revenue, setRevenue] = useState("");
  const [userName, setUserName] = useState("");

  const [goldIntensity, setGoldIntensity] = useState<"subtle" | "moderate" | "bold">("subtle");
  const [animSpeed, setAnimSpeed] = useState<"normal" | "reduced" | "off">("normal");
  const [sidebarDefault, setSidebarDefault] = useState<"expanded" | "collapsed">("expanded");
  const [density, setDensity] = useState<"normal" | "compact">("normal");
  const [pantheonView, setPantheonView] = useState<"hierarchy" | "list">("hierarchy");

  const [confirmClear, setConfirmClear] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadAgents() {
    fetch("/api/agents").then((r) => r.json()).then(setAgents);
  }

  function loadSettings() {
    fetch("/api/settings").then((r) => r.json()).then((s: Record<string, string>) => {
      if (s.anthropic_api_key) setApiKey(s.anthropic_api_key);
      if (s.revenue) setRevenue(s.revenue);
      if (s.user_name) setUserName(s.user_name);
      if (s.gold_intensity) setGoldIntensity(s.gold_intensity as typeof goldIntensity);
      if (s.anim_speed) setAnimSpeed(s.anim_speed as typeof animSpeed);
      if (s.sidebar_default) setSidebarDefault(s.sidebar_default as typeof sidebarDefault);
      if (s.density) setDensity(s.density as typeof density);
      if (s.pantheon_view) setPantheonView(s.pantheon_view as typeof pantheonView);
    });
  }

  useEffect(() => {
    loadAgents();
    loadSettings();
  }, []);

  async function addAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!newAgent.trim()) return;
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAgent.trim() }),
    });
    setNewAgent("");
    loadAgents();
  }

  async function saveAgentEdit() {
    if (!editingAgent) return;
    await fetch(`/api/agents/${editingAgent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingAgent.name }),
    });
    setEditingAgent(null);
    loadAgents();
  }

  async function deleteAgent(id: number) {
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    loadAgents();
  }

  async function saveSettings(updates: Record<string, string>) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  function applyGold(v: typeof goldIntensity) {
    setGoldIntensity(v);
    document.documentElement.setAttribute("data-gold", v);
    saveSettings({ gold_intensity: v });
  }

  function applyAnim(v: typeof animSpeed) {
    setAnimSpeed(v);
    document.documentElement.setAttribute("data-anim", v);
    saveSettings({ anim_speed: v });
  }

  function applyDensity(v: typeof density) {
    setDensity(v);
    if (v === "compact") document.documentElement.setAttribute("data-density", "compact");
    else document.documentElement.removeAttribute("data-density");
    saveSettings({ density: v });
  }

  function applySidebarDefault(v: typeof sidebarDefault) {
    setSidebarDefault(v);
    saveSettings({ sidebar_default: v });
  }

  function applyPantheonView(v: typeof pantheonView) {
    setPantheonView(v);
    saveSettings({ pantheon_view: v });
  }

  async function clearSection(section: string) {
    const endpoints: Record<string, string> = {
      sessions: "/api/sessions",
      tasks: "/api/tasks",
      notes: "/api/notes",
      goals: "/api/goals",
      contacts: "/api/contacts",
      reading: "/api/reading",
    };
    await fetch(endpoints[section], { method: "DELETE" });
    setConfirmClear(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const { imported } = await res.json() as { imported: number };
      setImportMsg(`Imported ${imported} records`);
    } catch {
      setImportMsg("Import failed — invalid JSON");
    }
    setTimeout(() => setImportMsg(""), 3000);
    if (fileRef.current) fileRef.current.value = "";
  }

  const SECTIONS = ["sessions", "tasks", "notes", "goals", "contacts", "reading"];

  return (
    <PageMotion>
    <div className="p-6 flex flex-col gap-8 max-w-2xl">
      <SectionHeader title="Hephaestus" epithet="The Forge — shape the instrument" />

      {/* Agent roster */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-heading font-semibold text-gold">Agent Roster</h2>
        <p className="text-xs text-warm-gray -mt-2">Agents appear in task assignee dropdowns.</p>

        {agents.length > 0 && (
          <ul className="flex flex-col gap-1 border border-border rounded-lg overflow-hidden">
            {agents.map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-0 bg-obsidian-surface hover:bg-obsidian-raised">
                {editingAgent?.id === a.id ? (
                  <>
                    <Input
                      className="h-7 text-sm flex-1"
                      value={editingAgent.name}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") saveAgentEdit(); if (e.key === "Escape") setEditingAgent(null); }}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={saveAgentEdit}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingAgent(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-ivory">{a.name}</span>
                    <button
                      className="text-xs text-warm-gray hover:text-gold px-2"
                      onClick={() => setEditingAgent({ id: a.id, name: a.name })}
                    >
                      Edit
                    </button>
                    <button
                      className="text-warm-gray hover:text-destructive"
                      onClick={() => deleteAgent(a.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addAgent} className="flex gap-2">
          <Input
            placeholder="Agent name…"
            value={newAgent}
            onChange={(e) => setNewAgent(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button type="submit" size="sm" disabled={!newAgent.trim()}>
            <Plus size={14} /> Add
          </Button>
        </form>
      </section>

      <Separator />

      {/* Integrations */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-heading font-semibold text-gold">Integrations</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-warm-gray">Your Name</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Syreese"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="max-w-48 text-sm"
            />
            <Button size="sm" onClick={() => saveSettings({ user_name: userName })}>Save</Button>
          </div>
          <p className="text-xs text-warm-gray">Used in Olympus greeting.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-warm-gray">Anthropic API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="sk-ant-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10 text-sm"
              />
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-gray hover:text-ivory"
                onClick={() => setShowKey((s) => !s)}
                type="button"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button size="sm" onClick={() => saveSettings({ anthropic_api_key: apiKey })}>Save</Button>
          </div>
          <p className="text-xs text-warm-gray">Used for reading list summarization. Stored locally.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-warm-gray">Business Revenue ($)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="max-w-48 text-sm"
            />
            <Button size="sm" onClick={() => saveSettings({ revenue })}>Save</Button>
          </div>
          <p className="text-xs text-warm-gray">Displayed on Olympus dashboard.</p>
        </div>
      </section>

      <Separator />

      {/* Appearance */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-heading font-semibold text-gold">Appearance</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-warm-gray">Gold Intensity</label>
            <Select value={goldIntensity} onValueChange={(v) => applyGold(v as typeof goldIntensity)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="subtle">Subtle</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-warm-gray">Animations</label>
            <Select value={animSpeed} onValueChange={(v) => applyAnim(v as typeof animSpeed)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="reduced">Reduced</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-warm-gray">Sidebar Default</label>
            <Select value={sidebarDefault} onValueChange={(v) => applySidebarDefault(v as typeof sidebarDefault)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">Expanded</SelectItem>
                <SelectItem value="collapsed">Collapsed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-warm-gray">Density</label>
            <Select value={density} onValueChange={(v) => applyDensity(v as typeof density)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-warm-gray">Pantheon Default View</label>
          <Select value={pantheonView} onValueChange={(v) => applyPantheonView(v as typeof pantheonView)}>
            <SelectTrigger className="text-sm max-w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hierarchy">Hierarchy (org chart)</SelectItem>
              <SelectItem value="list">List (flat grid)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {savedMsg && <p className="text-xs text-emerald-400">{savedMsg}</p>}
      </section>

      <Separator />

      {/* Keyboard shortcuts */}
      <section className="flex flex-col gap-2">
        <button
          className="flex items-center gap-2 text-sm font-heading font-semibold text-gold w-fit"
          onClick={() => setShortcutsOpen((o) => !o)}
        >
          Keyboard Shortcuts
          <ChevronDown size={14} className={cn("transition-transform", shortcutsOpen && "rotate-180")} />
        </button>

        {shortcutsOpen && (
          <div className="flex flex-col gap-1 border border-border rounded-lg overflow-hidden">
            {SHORTCUTS.map(({ keys, label }) => (
              <div key={label} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 bg-obsidian-surface">
                <span className="text-xs text-warm-gray">{label}</span>
                <div className="flex gap-1">
                  {keys.map((k) => (
                    <kbd key={k} className="text-xs font-mono text-ivory bg-obsidian-raised border border-border rounded px-1.5 py-0.5">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Data management */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-heading font-semibold text-gold">Data</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-warm-gray">Database Location</label>
          <code className="text-xs font-mono text-ivory bg-obsidian-raised border border-border px-3 py-2 rounded-md">
            ~/.hyperion/hyperion.db
          </code>
        </div>

        <div className="flex gap-2 flex-wrap">
          <a href="/api/export?format=json" download>
            <Button variant="outline" size="sm">
              <Download size={14} /> Export JSON
            </Button>
          </a>
          <a href="/api/export?format=csv" download>
            <Button variant="outline" size="sm">
              <Download size={14} /> Export CSV
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {importMsg && (
          <p className={cn("text-xs", importMsg.includes("failed") ? "text-destructive" : "text-emerald-400")}>
            {importMsg}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs text-warm-gray">Clear Section Data</label>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="text-xs capitalize text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setConfirmClear(s)}
              >
                Clear {s}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Confirm clear dialog */}
      <Dialog open={!!confirmClear} onOpenChange={(o) => { if (!o) setConfirmClear(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all {confirmClear} data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-warm-gray">This permanently deletes all {confirmClear} records. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmClear && clearSection(confirmClear)}>
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageMotion>
  );
}
