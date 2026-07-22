import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}

export function StatCard({ label, value, sub, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-obsidian-surface/60 backdrop-blur-sm px-4 py-3",
        "transition-transform duration-150 hover:-translate-y-0.5 hover:border-gold-muted hover:shadow-[0_0_12px_var(--gold-glow)]",
        className
      )}
    >
      <p className="text-2xl font-bold text-ivory leading-none">{value}</p>
      <p className="text-xs text-warm-gray mt-1.5">{label}</p>
      {sub && <p className="text-xs text-gold-muted mt-0.5">{sub}</p>}
    </div>
  );
}
