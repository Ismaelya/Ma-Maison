"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Check, CheckCheck, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, cn, getAvatarUrl } from "@/lib/utils";

type ChatBoxProps = {
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  conversationId: string;
  initialMessages?: any[];
  /** true if sender is OWNER/AGENCY without an active Premium subscription */
  isOwnerFree?: boolean;
  /** number of messages already sent in the last 24 hours (server-side count) */
  dailyUsed?: number;
  /** daily cap for free accounts (always 10) */
  dailyLimit?: number;
};

export function ChatBox({
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatar,
  conversationId,
  initialMessages = [],
  isOwnerFree = false,
  dailyUsed = 0,
  dailyLimit = 10,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [usedCount, setUsedCount] = useState(dailyUsed);
  const [limitReached, setLimitReached] = useState(isOwnerFree && dailyUsed >= dailyLimit);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Sync whenever the server-side prop changes (e.g. navigation between convs)
  useEffect(() => {
    setUsedCount(dailyUsed);
    setLimitReached(isOwnerFree && dailyUsed >= dailyLimit);
  }, [dailyUsed, isOwnerFree, dailyLimit]);

  // Auto-scroll to bottom of message thread
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to Supabase Realtime for instant message updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSending || limitReached) return;

    setSendError(null);
    setIsSending(true);
    const msgText = content.trim();
    setContent("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: msgText,
        }),
      });

      const json = await res.json();

      if (res.status === 403 && json.code === "MESSAGE_LIMIT_REACHED") {
        // Quota just hit — block the input immediately
        setLimitReached(true);
        setUsedCount(dailyLimit);
        setSendError(json.error);
        // Restore the unsent message text
        setContent(msgText);
        return;
      }

      if (!res.ok) {
        setSendError(json.error || "Erreur lors de l'envoi.");
        setContent(msgText);
        return;
      }

      if (json.success && json.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === json.message.id)) return prev;
          return [...prev, json.message];
        });
      }

      // Update local quota counter from API response
      if (isOwnerFree && json.quota && !json.quota.isPremium) {
        const newUsed = json.quota.used ?? usedCount + 1;
        setUsedCount(newUsed);
        if (newUsed >= dailyLimit) {
          setLimitReached(true);
        }
      }
    } catch (err: any) {
      console.error("Erreur d'envoi du message:", err);
      setSendError("Erreur réseau. Veuillez réessayer.");
      setContent(msgText);
    } finally {
      setIsSending(false);
    }
  }

  const remaining = Math.max(0, dailyLimit - usedCount);
  const isNearLimit = isOwnerFree && remaining <= 3 && !limitReached;

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-neutral-50 px-6 py-4">
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 shadow-sm">
          <img src={getAvatarUrl(partnerAvatar, partnerName)} alt={partnerName} className="h-full w-full rounded-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-neutral-900 text-sm">{partnerName}</h3>
          <p className="text-xs text-neutral-500">En ligne · Messagerie sécurisée</p>
        </div>
        {/* Free quota badge in header */}
        {isOwnerFree && (
          <div
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              limitReached
                ? "bg-red-100 text-red-700"
                : isNearLimit
                  ? "bg-amber-100 text-amber-700"
                  : "bg-neutral-100 text-neutral-500"
            )}
          >
            {usedCount}/{dailyLimit} msg
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50/30">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-neutral-400 text-sm">
            Envoyez un message pour démarrer la discussion avec {partnerName}.
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = msg.senderId || msg.sender_id;
            const isMine = senderId === currentUserId;
            const msgDate = msg.createdAt || msg.created_at;
            const isRead = msg.isRead !== undefined ? msg.isRead : msg.is_read;

            return (
              <div
                key={msg.id || idx}
                className={cn("flex flex-col max-w-[75%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
                    isMine
                      ? "bg-primary-600 text-white rounded-br-none"
                      : "bg-white border border-[var(--border)] text-neutral-900 rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-neutral-400">
                  <span>{formatRelativeTime(msgDate)}</span>
                  {isMine && (
                    isRead ? (
                      <CheckCheck className="h-3 w-3 text-blue-500 inline" />
                    ) : (
                      <Check className="h-3 w-3 text-neutral-400 inline" />
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Error Alert */}
      {sendError && !limitReached && (
        <div className="flex items-start gap-2 border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Limit Reached Banner */}
      {limitReached && (
        <div className="flex items-center justify-between border-t border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <Lock className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <span className="font-medium">Limite de 10 messages/jour atteinte en mode Gratuit.</span>
          </div>
          <Link
            href="/dashboard/abonnement"
            className="ml-4 flex-shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Passer Premium
          </Link>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="border-t border-[var(--border)] bg-white p-4">
        {/* Quota counter for near-limit warning */}
        {isOwnerFree && !limitReached && (
          <p
            className={cn(
              "mb-2 text-[11px]",
              isNearLimit ? "font-semibold text-amber-600" : "text-neutral-400"
            )}
          >
            {usedCount}/{dailyLimit} messages aujourd&apos;hui
            {isNearLimit && ` — il vous reste ${remaining} message${remaining > 1 ? "s" : ""}`}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={limitReached ? "Limite atteinte — passez Premium" : "Écrivez votre message..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={limitReached}
            className={cn(
              "flex-1 rounded-xl border bg-neutral-50 px-4 py-3 text-sm focus:outline-none",
              limitReached
                ? "cursor-not-allowed border-neutral-200 text-neutral-400 opacity-60"
                : "border-[var(--border)] focus:border-primary-500 focus:bg-white"
            )}
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending || limitReached}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
