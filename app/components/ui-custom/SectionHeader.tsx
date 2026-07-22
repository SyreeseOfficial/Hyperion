import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  epithet?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, epithet, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between pb-4 border-b border-border", className)}>
      <div>
        <h1 className="text-2xl font-heading font-semibold text-gold tracking-wide">{title}</h1>
        {epithet && <p className="text-xs text-warm-gray mt-0.5 italic">{epithet}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 mt-0.5">{actions}</div>}
    </div>
  );
}
