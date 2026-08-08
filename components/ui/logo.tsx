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
        <span className="inline-flex items-baseline gap-[0.18em]">
          {/* "Ma" — Bleu profond (logo) */}
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              background: variant === "light"
                ? "linear-gradient(135deg, #FFFFFF 0%, #D6DCFA 100%)"
                : "linear-gradient(135deg, #102281 0%, #1832BF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ma
          </span>
          {/* "Maison" — Turquoise/émeraude (logo) */}
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              background: variant === "light"
                ? "linear-gradient(135deg, #05CBAD 0%, #9CFCEE 100%)"
                : "linear-gradient(135deg, #05CBAD 0%, #038672 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Maison
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
