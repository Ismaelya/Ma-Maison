"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Variant classes strictly following Partie 8 guidelines
    // Primary: Deep Blue (#13299A), hover Logo Blue (#102281)
    // Secondary: Neutral Panel (#F1F5F9)
    // Outline: Border (#E2E8F0)
    // Danger: Red (#DC2626)
    // Ghost: Transparent
    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-700)] focus-visible:ring-[var(--color-primary)] shadow-sm",
      secondary:
        "bg-[var(--color-muted)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-stone-200 focus-visible:ring-stone-400",
      outline:
        "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-muted)] focus-visible:ring-stone-400",
      danger:
        "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90 focus-visible:ring-[var(--color-danger)]",
      ghost:
        "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-muted)]/50 focus-visible:ring-stone-400",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "h-9 px-3.5 text-xs rounded-lg gap-1.5",
      md: "h-11 px-5 text-sm rounded-xl gap-2",
      lg: "h-13 px-6 text-base rounded-2xl gap-2.5 font-bold",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full flex",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
