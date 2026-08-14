"use client";

import { cn } from "@/lib/utils";

type WhatsApp3DButtonProps = {
  whatsappNumber?: string | null;
  propertyTitle?: string;
  className?: string;
  showText?: boolean;
};

export function WhatsApp3DButton({
  whatsappNumber,
  propertyTitle,
  className,
  showText = true,
}: WhatsApp3DButtonProps) {
  if (!whatsappNumber) return null;

  const digits = whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;

  const cleanNumber = digits.length === 8 ? `227${digits}` : digits;
  const message = propertyTitle
    ? `Bonjour, je suis intéressé par votre annonce "${propertyTitle}" sur Ma Maison Niger.`
    : "Bonjour, je suis intéressé par votre annonce sur Ma Maison Niger.";
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter sur WhatsApp"
      className={cn(
        "group relative flex items-center justify-center gap-2.5 rounded-xl text-white font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-95 shadow-md",
        showText ? "w-full py-3 px-4 text-sm" : "h-10 w-10 rounded-full",
        className
      )}
      style={{
        background: "radial-gradient(circle at 35% 25%, #4de882 0%, #25d366 55%, #128c7e 100%)",
        boxShadow:
          "inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2.5px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(37, 211, 102, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <svg
        className="h-5 w-5 fill-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12.011 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.764.459 3.486 1.332 5.003l-1.416 5.17 5.291-1.387c1.464.798 3.116 1.218 4.78 1.219h.004c5.506 0 9.989-4.478 9.99-9.984 0-2.669-1.038-5.176-2.925-7.062a9.927 9.927 0 0 0-7.062-2.925h-.001zm.003 2c2.133 0 4.137.831 5.646 2.339a7.943 7.943 0 0 1 2.338 5.644c0 4.403-3.582 7.984-7.987 7.984h-.003c-1.478 0-2.924-.407-4.181-1.176l-.3-.183-3.11.815.829-3.028-.201-.32a7.948 7.948 0 0 1-1.215-4.25c0-4.404 3.583-7.985 7.985-7.985h-.003zm-3.376 3.992c-.174 0-.458.065-.698.326-.24.261-.915.894-.915 2.18 0 1.285.937 2.527 1.067 2.701.131.174 1.844 2.815 4.467 3.949.624.27 1.11.431 1.489.551.626.199 1.196.171 1.646.104.502-.075 1.547-.632 1.765-1.242.218-.61.218-1.132.153-1.242-.065-.109-.24-.174-.523-.316-.283-.141-1.678-.828-1.939-.923-.261-.095-.452-.142-.643.142-.191.283-.741.924-.909 1.115-.168.191-.336.213-.619.071-.283-.142-1.195-.44-2.276-1.404-.841-.75-1.408-1.676-1.573-1.959-.165-.283-.018-.436.124-.577.128-.127.283-.331.425-.497.142-.165.189-.283.283-.472.095-.189.047-.355-.024-.497-.071-.142-.643-1.548-.881-2.116-.232-.553-.468-.478-.643-.487-.165-.008-.355-.008-.545-.008z" />
      </svg>
      {showText && <span>Discuter sur WhatsApp</span>}
    </a>
  );
}
