import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  href?: string;
  variant?: "default" | "light";
  badge?: React.ReactNode;
};

export function Logo({
  className,
  imageClassName,
  showText = true,
  href = "/",
  variant = "default",
  badge,
}: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/images/logo.png"
        alt="Ma Maison Logo"
        width={40}
        height={40}
        className={cn(
          "h-10 w-auto object-contain transition-all duration-300 dark:brightness-110 dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]",
          imageClassName
        )}
        priority
      />
      {showText && (
        <span
          className={cn(
            "text-xl font-bold tracking-tight inline-flex items-center gap-2 transition-colors",
            variant === "light" ? "text-white" : "text-[var(--color-text)] dark:text-white"
          )}
        >
          <span>
            <span className={variant === "light" ? "text-white" : "text-[var(--color-text)] dark:text-white"}>
              Ma
            </span>{" "}
            <span className="text-[var(--color-primary)] dark:text-blue-400">Maison</span>
          </span>
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href as any} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
