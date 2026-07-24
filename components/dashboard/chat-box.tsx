"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, cn } from "@/lib/utils";

type ChatBoxProps = {
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  conversationId: string;
  initialMessages?: any[];
};

export function ChatBox({
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatar,
  conversationId,
  initialMessages = [],
}: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
    if (!content.trim() || isSending) return;

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
      if (json.success && json.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === json.data.id)) return prev;
          return [...prev, json.data];
        });
      }
    } catch (err: any) {
      console.error("Erreur d'envoi du message:", err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-neutral-50 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
          {partnerAvatar ? (
            <img src={partnerAvatar} alt={partnerName} className="h-full w-full rounded-full object-cover" />
          ) : (
            partnerName.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h3 className="font-bold text-neutral-900 text-sm">{partnerName}</h3>
          <p className="text-xs text-neutral-500">En ligne · Messagerie sécurisée</p>
        </div>
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

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="border-t border-[var(--border)] bg-white p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Écrivez votre message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 rounded-xl border border-[var(--border)] bg-neutral-50 px-4 py-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
