"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { StatCard } from "@/components/ui-custom/StatCard";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import PageMotion from "@/components/PageMotion";

type Timeframe = "today" | "week" | "all";
type Stats = {
  session_count: number;
  total_cost: number;
  tokens_in: number;
  tokens_out: number;
  tasks_in_progress: number;
  open_goals: number;
  hours_logged: number;
  revenue: number;
};
type Activity = { id: number; type: string; label: string; created_at: string };
type Briefing = { id: number; content: string; created_at: string } | null;
type ChartData = { cost: { date: string; cost: number }[]; tokens: { date: string; tokens_in: number; tokens_out: number }[]; tasks: { date: string; count: number }[] };

function fmtTime(ts: string) {
  return new Date(ts + (ts.includes("T") ? "Z" : "")).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const TYPE_COLORS: Record<string, string> = {
  session: "bg-blue-400/20 text-blue-400",
  task: "bg-gold/20 text-gold",
  note: "bg-purple-400/20 text-purple-400",
  goal: "bg-emerald-400/20 text-emerald-400",
  contact: "bg-amber-400/20 text-amber-400",
  reading: "bg-pink-400/20 text-pink-400",
};

export default function OlympusPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [briefing, setBriefing] = useState<Briefing>(null);
  const [briefingOpen, setBriefingOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/stats?timeframe=${timeframe}`).then((r) => r.json()).then(setStats);
  }, [timeframe]);

  useEffect(() => {
    fetch("/api/activity").then((r) => r.json()).then(setActivity);
    fetch("/api/charts").then((r) => r.json()).then(setCharts);
    fetch("/api/briefing").then((r) => r.json()).then(setBriefing);

    const interval = setInterval(() => {
      fetch("/api/activity").then((r) => r.json()).then(setActivity);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const isEmpty = !stats || (stats.session_count === 0 && stats.tasks_in_progress === 0 && stats.open_goals === 0);

  return (
    <PageMotion>
    <div className="p-6 flex flex-col gap-8">
      <SectionHeader
        title="Olympus"
        epithet="The Summit — command, clarity, control"
        actions={
          <div className="flex gap-1 border border-border rounded-md p-0.5">
            {(["today", "week", "all"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors",
                  timeframe === tf ? "bg-gold text-obsidian font-semibold" : "text-warm-gray hover:text-ivory"
                )}
              >
                {tf === "today" ? "Today" : tf === "week" ? "This Week" : "All Time"}
              </button>
            ))}
          </div>
        }
      />

      {/* Morning briefing */}
      {briefing && (
        <div className="rounded-lg border border-gold-muted/30 bg-gold-glow p-4 flex flex-col gap-2">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setBriefingOpen((o) => !o)}
          >
            <span className="text-xs font-heading font-semibold text-gold uppercase tracking-wide">Morning Briefing</span>
            {briefingOpen ? <ChevronUp size={14} className="text-warm-gray" /> : <ChevronDown size={14} className="text-warm-gray" />}
          </button>
          {briefingOpen && (
            <p className="text-sm text-ivory whitespace-pre-wrap leading-relaxed">{briefing.content}</p>
          )}
          <p className="text-xs text-warm-gray">{fmtTime(briefing.created_at)}</p>
        </div>
      )}

      {isEmpty ? (
        <EmptyState copy="The mountain awaits its first dispatch." />
      ) : (
        <>
          {/* Stat strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatCard label="Sessions" value={stats.session_count} />
              <StatCard label="Total Cost" value={`$${stats.total_cost.toFixed(2)}`} />
              <StatCard label="Tokens In" value={stats.tokens_in >= 1000 ? `${(stats.tokens_in / 1000).toFixed(1)}k` : stats.tokens_in} />
              <StatCard label="Tokens Out" value={stats.tokens_out >= 1000 ? `${(stats.tokens_out / 1000).toFixed(1)}k` : stats.tokens_out} />
              <StatCard label="In Progress" value={stats.tasks_in_progress} />
              <StatCard label="Open Goals" value={stats.open_goals} />
              <StatCard label="Hours Today" value={stats.hours_logged} />
              <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} />
            </div>
          )}

          {/* Charts */}
          {charts && (charts.cost.length > 0 || charts.tokens.length > 0 || charts.tasks.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {charts.cost.length > 0 && (
                <div className="rounded-lg border border-border bg-obsidian-surface p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Cost Over Time</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={charts.cost} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-warm-gray)" }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-warm-gray)" }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--obsidian-raised)", border: "1px solid var(--border)", fontSize: 11 }} formatter={(v) => [`$${Number(v).toFixed(4)}`, "Cost"]} />
                      <Bar dataKey="cost" fill="var(--color-gold)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {charts.tokens.length > 0 && (
                <div className="rounded-lg border border-border bg-obsidian-surface p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Token Usage</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={charts.tokens} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-warm-gray)" }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-warm-gray)" }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--obsidian-raised)", border: "1px solid var(--border)", fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="tokens_in" name="In" stroke="var(--color-gold)" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="tokens_out" name="Out" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {charts.tasks.length > 0 && (
                <div className="rounded-lg border border-border bg-obsidian-surface p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Tasks Completed</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={charts.tasks} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-warm-gray)" }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-warm-gray)" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--obsidian-raised)", border: "1px solid var(--border)", fontSize: 11 }} />
                      <Bar dataKey="count" name="Tasks" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Activity feed */}
          {activity.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-medium text-warm-gray uppercase tracking-wide">Recent Activity</h3>
              <ul className="flex flex-col gap-1">
                {activity.map((a, i) => (
                  <li key={`${a.type}-${a.id}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-obsidian-raised text-sm">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium capitalize", TYPE_COLORS[a.type] ?? "bg-border/40 text-warm-gray")}>
                      {a.type}
                    </span>
                    <span className="flex-1 text-ivory truncate">{a.label}</span>
                    <span className="text-xs text-warm-gray shrink-0">{fmtTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
    </PageMotion>
  );
}
