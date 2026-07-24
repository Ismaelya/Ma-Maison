"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    const radioId = id || props.name;

    return (
      <label
        htmlFor={radioId}
        className="flex cursor-pointer items-start gap-3 select-none text-left"
      >
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] transition-all peer-checked:border-[var(--color-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-ring)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          />
          <div className="absolute h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none" />
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
    );
  }
);

Radio.displayName = "Radio";

export function RadioGroup({
  name,
  options,
  selectedValue,
  onChange,
  label,
  error,
  className,
}: RadioGroupProps) {
  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}

      <div className={cn("space-y-2", className)}>
        {options.map((opt) => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            checked={selectedValue === opt.value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={opt.disabled}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs font-medium text-[var(--color-danger)] animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
