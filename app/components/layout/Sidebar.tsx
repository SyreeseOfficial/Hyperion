"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Zap,
  CheckSquare,
  ScrollText,
  Target,
  Users,
  BookOpen,
  Network,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",          label: "Olympus",    icon: LayoutDashboard, epithet: "The Summit" },
  { href: "/sessions",  label: "Prometheus", icon: Zap,             epithet: "Fire Stolen" },
  { href: "/tasks",     label: "Hermes",     icon: CheckSquare,     epithet: "The Messenger" },
  { href: "/notes",     label: "Mnemosyne",  icon: ScrollText,      epithet: "Memory" },
  { href: "/goals",     label: "Themis",     icon: Target,          epithet: "Divine Law" },
  { href: "/contacts",  label: "Apollo",     icon: Users,           epithet: "The Oracle" },
  { href: "/reading",   label: "Iris",       icon: BookOpen,        epithet: "The Rainbow" },
  { href: "/pantheon", label: "Pantheon",   icon: Network,         epithet: "The Council" },
];

function navItemClass(active: boolean, extra = "") {
  return cn(
    "flex items-center gap-3 px-3 py-2 mx-1.5 rounded-md text-sm transition-colors",
    "hover:text-gold hover:bg-gold-glow",
    active ? "text-gold bg-gold-glow" : "text-warm-gray",
    extra
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem("sidebar-collapsed", String(!c));
      return !c;
    });
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-obsidian-surface border-r border-border transition-[width] duration-200 shrink-0",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Wordmark */}
      <div className={cn("flex items-center px-3 h-14 border-b border-border shrink-0", collapsed && "justify-center")}>
        {collapsed ? (
          <span className="text-gold font-heading font-bold text-sm select-none">H</span>
        ) : (
          <span className="text-gold font-heading font-bold tracking-widest text-base select-none">HYPERION</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, epithet }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          if (collapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link href={href} className={cn(navItemClass(active), "justify-center")} />
                  }
                >
                  <Icon size={16} />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <p className="font-heading font-semibold">{label}</p>
                  <p className="text-warm-gray">{epithet}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={href} href={href} className={navItemClass(active)}>
              <Icon size={16} className="shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + collapse toggle */}
      <div className="border-t border-border py-2 flex flex-col gap-0.5">
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/settings"
                    className={cn(navItemClass(pathname.startsWith("/settings")), "justify-center")}
                  />
                }
              >
                <Settings size={16} />
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={toggle}
                    className={cn(navItemClass(false), "justify-center")}
                  />
                }
              >
                <PanelLeftOpen size={16} />
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Link
              href="/settings"
              className={navItemClass(pathname.startsWith("/settings"))}
            >
              <Settings size={16} className="shrink-0" />
              <span className="font-medium">Settings</span>
            </Link>
            <button onClick={toggle} className={navItemClass(false)}>
              <PanelLeftClose size={16} className="shrink-0" />
              <span className="font-medium">Collapse</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
