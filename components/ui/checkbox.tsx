"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  error?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, description, id, checked, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className="space-y-1.5 text-left">
        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-start gap-3 select-none"
        >
          <div className="relative flex items-center justify-center pt-0.5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "h-5 w-5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] transition-all peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-ring)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                error && "border-[var(--color-danger)]",
                className
              )}
            />
            <Check className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none" />
          </div>

          {(label || description) && (
            <div>
              {label && (
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {label}
                </span>
              )}
              {description && (
                <p className="text-xs text-neutral-500">{description}</p>
              )}
            </div>
          )}
        </label>

        {error && (
          <p className="text-xs font-medium text-[var(--color-danger)] animate-fade-in pl-8">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
