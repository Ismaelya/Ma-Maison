import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  href?: string;
  variant?: "default" | "light";
};

export function Logo({
  className,
  imageClassName,
  showText = true,
  href = "/",
  variant = "default",
}: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/images/logo.png"
        alt="Ma Maison Logo"
        width={40}
        height={40}
        className={cn("h-10 w-auto object-contain", imageClassName)}
        priority
      />
      {showText && (
        <span
          className={cn(
            "text-xl font-bold tracking-tight",
            variant === "light" ? "text-white" : "text-neutral-900"
          )}
        >
          <span className={variant === "light" ? "text-white" : "text-[#0A2540]"}>Ma</span>{" "}
          <span className="text-[#00C9A7]">Maison</span>
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
