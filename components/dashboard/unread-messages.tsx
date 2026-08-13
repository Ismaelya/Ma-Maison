"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Hook to manage real-time unread messages count.
 * Starts with initial count from SSR (no zero flash) and listens
 * to Supabase Realtime INSERT/UPDATE on messages.
 */
export function useRealtimeUnreadCount(initialCount: number, userId: string) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  useEffect(() => {
    setUnreadCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`unread_messages_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.senderId !== userId) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.senderId !== userId && (newMsg.isRead === true || newMsg.is_read === true)) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}

export function RealtimeUnreadStatCard({
  initialCount,
  userId,
}: {
  initialCount: number;
  userId: string;
}) {
  const unreadCount = useRealtimeUnreadCount(initialCount, userId);

  return (
    <div
      className={cn(
        "group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]",
        unreadCount > 0 && "ring-2 ring-yellow-300"
      )}
    >
      <div className="inline-flex rounded-xl p-2.5 transition-transform group-hover:scale-105 bg-blue-100 text-blue-600">
        <MessageSquare className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
        {unreadCount}
      </p>
      <p className="text-sm text-neutral-500">Messages non lus</p>
    </div>
  );
}

export function RealtimeUnreadActionLink({
  initialCount,
  userId,
}: {
  initialCount: number;
  userId: string;
}) {
  const unreadCount = useRealtimeUnreadCount(initialCount, userId);

  return (
    <Link
      href="/dashboard/messages"
      className="group relative flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-neutral-900">Messages</p>
        <p className="text-sm text-neutral-500">
          {unreadCount > 0
            ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""}`
            : "Aucun nouveau message"}
        </p>
      </div>
    </Link>
  );
}
