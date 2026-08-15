"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /**
   * "default" — bordered, card-colored background (var(--color-bg)/var(--color-border)).
   * "filled" — opaque gray fill with a visible resting border, for forms placed
   * directly on a white/dark card (e.g. auth pages). Both light and dark values
   * are explicit here so contrast can't drift the way ad hoc `bg-stone-100`
   * overrides did (light-mode-only gray + near-white dark-mode text = unreadable).
   */
  variant?: "default" | "filled";
}

const inputVariants: Record<"default" | "filled", string> = {
  default:
    "border-[var(--color-border)] bg-[var(--color-bg)] focus:border-[var(--color-primary)]",
  // `!` forces these border colors past the unlayered `* { border-color: var(--color-border); }`
  // reset in globals.css, which otherwise beats layered Tailwind utilities regardless of specificity.
  filled:
    "h-12 rounded-2xl !border-stone-300 dark:!border-stone-600 bg-stone-100 dark:bg-slate-800 focus:!border-[var(--color-secondary-500)] focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[var(--color-secondary-500)]/25",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = "text",
      id,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === "password";
    const actualType = isPasswordType ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center text-neutral-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-sm text-[var(--color-text)] transition-colors placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-70",
              inputVariants[variant],
              leftIcon && "pl-11",
              (rightIcon || isPasswordType) && "pr-11",
              error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)] focus:ring-2",
              className
            )}
            {...props}
          />

          {isPasswordType ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none transition-colors p-1 rounded-md"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          ) : rightIcon ? (
            <div className="absolute right-3.5 flex items-center text-neutral-400">
              {rightIcon}
            </div>
          ) : null}
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

Input.displayName = "Input";
