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
          {/* "Ma" — bleu profond du logo */}
          <span
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              background: variant === "light"
                ? "linear-gradient(135deg, #e0f2fe 0%, #a5f3fc 100%)"
                : "linear-gradient(135deg, #1a28c0 0%, #2563eb 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ma
          </span>
          {/* "Maison" — cyan/turquoise du logo */}
          <span
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              background: variant === "light"
                ? "linear-gradient(135deg, #67e8f9 0%, #ffffff 100%)"
                : "linear-gradient(135deg, #0ea5e9 0%, #06d6c7 100%)",
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
