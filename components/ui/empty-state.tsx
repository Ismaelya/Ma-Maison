"use client";

import { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  title = "Aucune donnée trouvée",
  description = "Il n'y a aucun élément à afficher pour le moment.",
  icon,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 p-8 text-center animate-fade-in",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-[var(--color-border)] text-neutral-400">
        {icon || <FolderOpen className="h-7 w-7 text-neutral-400" />}
      </div>

      <h3 className="mt-4 text-h4 font-bold text-neutral-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{description}</p>

      {actionText && onAction && (
        <Button variant="primary" size="md" className="mt-6" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
