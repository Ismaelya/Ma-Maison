import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
}

export function Skeleton({
  className,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded-md",
    circular: "h-12 w-12 rounded-full",
    rectangular: "h-24 w-full rounded-xl",
    card: "h-64 w-full rounded-2xl",
  };

  return (
    <div
      className={cn(
        "animate-shimmer bg-neutral-200 pointer-events-none select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

/** Composite skeleton loader for Property Card */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-3 space-y-3">
      <Skeleton variant="card" className="h-44 w-full rounded-xl" />
      <Skeleton variant="text" className="h-5 w-3/4" />
      <Skeleton variant="text" className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="text" className="h-4 w-1/3" />
        <Skeleton variant="text" className="h-4 w-1/3" />
      </div>
    </div>
  );
}

/** Composite skeleton loader for Admin/Dashboard Tables */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-1/4" />
          </div>
          <Skeleton variant="text" className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
