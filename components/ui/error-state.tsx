"use client";

import { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionText?: string;
  icon?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données. Veuillez vérifier votre connexion ou réessayer.",
  onRetry,
  actionText = "Réessayer",
  icon,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[250px] w-full flex-col items-center justify-center rounded-3xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-8 text-center animate-fade-in",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-danger)]/20 text-[var(--color-danger)]">
        {icon || <AlertCircle className="h-6 w-6" />}
      </div>

      <h3 className="mt-4 text-h4 font-bold text-neutral-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-neutral-600">{message}</p>

      {onRetry && (
        <Button
          variant="danger"
          size="md"
          className="mt-6"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={onRetry}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
