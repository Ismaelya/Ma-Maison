"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type ToastNotificationProps = {
  type?: ToastType;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  durationMs?: number;
};

export function ToastNotification({
  type = "info",
  message,
  isOpen,
  onClose,
  durationMs = 4000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (!isOpen || durationMs <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgStyles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-scale-in text-sm max-w-md">
      <div className={cn("flex items-center gap-3 w-full rounded-xl p-3 border", bgStyles[type])}>
        {icons[type]}
        <span className="flex-1 font-medium">{message}</span>
        <button onClick={onClose} className="rounded-full p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
