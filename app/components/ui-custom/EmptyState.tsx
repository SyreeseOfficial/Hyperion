import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  copy: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ copy, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        "border border-dashed border-border rounded-lg",
        /* Greek key via repeating linear gradient */
        "relative overflow-hidden",
        className
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 6px, oklch(1 0 0 / 3%) 6px, oklch(1 0 0 / 3%) 7px), repeating-linear-gradient(90deg, transparent, transparent 6px, oklch(1 0 0 / 3%) 6px, oklch(1 0 0 / 3%) 7px)",
      }}
    >
      {/* Greek key border accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-muted to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-muted to-transparent" />

      <p className="text-sm text-warm-gray italic max-w-xs">{copy}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
