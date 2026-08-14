"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text)] transition-colors placeholder:text-neutral-400 focus:border-[var(--color-primary)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-70 resize-y",
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
            className
          )}
          {...props}
        />

        {error && (
          <p className="text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
