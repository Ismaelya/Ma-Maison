"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, durationMs };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, dur?: number) => showToast(msg, "success", dur), [showToast]);
  const error = useCallback((msg: string, dur?: number) => showToast(msg, "error", dur), [showToast]);
  const info = useCallback((msg: string, dur?: number) => showToast(msg, "info", dur), [showToast]);
  const warning = useCallback((msg: string, dur?: number) => showToast(msg, "warning", dur), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <ToastItemContainer key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

function ToastItemContainer({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-[var(--color-danger)] flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] flex-shrink-0" />,
  };

  const bgStyles: Record<ToastType, string> = {
    success: "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-text)]",
    error: "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-text)]",
    info: "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-text)]",
    warning: "bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30 text-[var(--color-text)]",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-scale-in text-sm font-medium",
        bgStyles[toast.type]
      )}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <span>{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Standalone component for backward compatibility */
export function ToastNotification({
  type = "info",
  message,
  isOpen,
  onClose,
}: {
  type?: ToastType;
  message: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
      <ToastItemContainer toast={{ id: "standalone", type, message }} onClose={onClose} />
    </div>
  );
}
