"use client";

import { SelectHTMLAttributes, ReactNode, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pr-10 text-sm text-[var(--color-text)] transition-colors focus:border-[var(--color-primary)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-70",
              error && "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected hidden>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown className="absolute right-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>

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

Select.displayName = "Select";
