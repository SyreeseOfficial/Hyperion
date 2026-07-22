"use client";

import { useState, useEffect } from "react";
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
import { Trash2, Plus, Download, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import PageMotion from "@/components/PageMotion";

type Agent = { id: number; name: string };

const DB_PATH = `${typeof window !== "undefined" && navigator.userAgent.includes("Linux") ? "~" : "~"}/.hyperion/hyperion.db`;

export default function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newAgent, setNewAgent] = useState("");
  const [editingAgent, setEditingAgent] = useState<{ id: number; name: string } | null>(null);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [revenue, setRevenue] = useState("");

  const [goldIntensity, setGoldIntensity] = useState<"subtle" | "moderate" | "bold">("subtle");
  const [animSpeed, setAnimSpeed] = useState<"normal" | "reduced" | "off">("normal");
  const [sidebarDefault, setSidebarDefault] = useState<"expanded" | "collapsed">("expanded");

  const [confirmClear, setConfirmClear] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  function loadAgents() {
    fetch("/api/agents").then((r) => r.json()).then(setAgents);
  }

  function loadSettings() {
    fetch("/api/settings").then((r) => r.json()).then((s: Record<string, string>) => {
      setSettings(s);
      if (s.anthropic_api_key) setApiKey(s.anthropic_api_key);
      if (s.revenue) setRevenue(s.revenue);
      if (s.gold_intensity) setGoldIntensity(s.gold_intensity as typeof goldIntensity);
      if (s.anim_speed) setAnimSpeed(s.anim_speed as typeof animSpeed);
      if (s.sidebar_default) setSidebarDefault(s.sidebar_default as typeof sidebarDefault);
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

  function applySidebarDefault(v: typeof sidebarDefault) {
    setSidebarDefault(v);
    saveSettings({ sidebar_default: v });
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {savedMsg && <p className="text-xs text-emerald-400">{savedMsg}</p>}
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

        <div className="flex gap-2">
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
        </div>

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
