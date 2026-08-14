"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const COMMON_COUNTRY_CODES = [
  { code: "+227", flag: "🇳🇪", name: "Niger (+227)" },
  { code: "+33", flag: "🇫🇷", name: "France (+33)" },
  { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire (+225)" },
  { code: "+221", flag: "🇸🇳", name: "Sénégal (+221)" },
  { code: "+223", flag: "🇲🇱", name: "Mali (+223)" },
  { code: "+226", flag: "🇧🇫", name: "Burkina Faso (+226)" },
  { code: "+228", flag: "🇹🇬", name: "Togo (+228)" },
  { code: "+229", flag: "🇧🇯", name: "Bénin (+229)" },
  { code: "+237", flag: "🇨🇲", name: "Cameroun (+237)" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada (+1)" },
  { code: "+44", flag: "🇬🇧", name: "Royaume-Uni (+44)" },
  { code: "OTHER", flag: "🌍", name: "Autre indicatif..." },
] as const;

type WhatsAppInputProps = {
  value?: string | null;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
};

export function WhatsAppInput({
  value = "",
  onChange,
  error,
  helperText = "Sélectionnez l'indicatif et saisissez votre numéro. Si renseigné, un bouton WhatsApp s'affichera.",
  className,
  disabled = false,
}: WhatsAppInputProps) {
  const [selectedCode, setSelectedCode] = useState<string>("+227");
  const [numberPart, setNumberPart] = useState<string>("");

  useEffect(() => {
    if (!value || value.trim() === "") {
      setSelectedCode("+227");
      setNumberPart("");
      return;
    }

    const trimmed = value.trim();

    // Match against known country codes
    const foundCode = COMMON_COUNTRY_CODES.find(
      (c) => c.code !== "OTHER" && trimmed.startsWith(c.code)
    );

    if (foundCode) {
      setSelectedCode(foundCode.code);
      setNumberPart(trimmed.slice(foundCode.code.length).trim());
    } else if (trimmed.startsWith("+")) {
      // Custom international code
      setSelectedCode("OTHER");
      setNumberPart(trimmed);
    } else {
      // Raw digits without prefix (e.g. 96707116) -> Default to +227
      setSelectedCode("+227");
      setNumberPart(trimmed);
    }
  }, [value]);

  function handleCodeChange(newCode: string) {
    setSelectedCode(newCode);
    emitValue(newCode, numberPart);
  }

  function handleNumberChange(newNumber: string) {
    setNumberPart(newNumber);
    emitValue(selectedCode, newNumber);
  }

  function emitValue(code: string, numberStr: string) {
    if (!onChange) return;
    const cleanNum = numberStr.trim();
    if (!cleanNum) {
      onChange("");
      return;
    }

    if (code === "OTHER") {
      onChange(cleanNum.startsWith("+") ? cleanNum : `+${cleanNum}`);
    } else {
      if (cleanNum.startsWith("+")) {
        onChange(cleanNum);
      } else {
        onChange(`${code}${cleanNum}`);
      }
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-semibold text-[var(--color-text)]">
        Numéro WhatsApp (optionnel)
      </label>
      <div className="flex gap-2">
        {/* Country Code Select Dropdown */}
        <select
          value={selectedCode}
          disabled={disabled}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-neutral-50 px-3 py-3 text-xs sm:text-sm font-semibold focus:border-primary-500 focus:bg-white focus:outline-none transition-colors"
          aria-label="Indicatif pays WhatsApp"
        >
          {COMMON_COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.code !== "OTHER" ? item.code : "Autre"}
            </option>
          ))}
        </select>

        {/* Local Number Input */}
        <div className="relative flex-1">
          <input
            type="text"
            disabled={disabled}
            value={numberPart}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={selectedCode === "+227" ? "96 70 71 16" : selectedCode === "+33" ? "6 12 34 56 78" : "00 00 00 00"}
            className={cn(
              "w-full rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none transition-colors",
              error && "border-red-500 focus:border-red-500"
            )}
          />
        </div>
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-500">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
