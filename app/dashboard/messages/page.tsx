import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const { profile } = await requireAuth();
  const supabase = await createClient();

  // Get conversations for current user
  let { data: convData } = await supabase
    .from("conversations")
    .select("*, tenant:profiles!tenant_id(id, name, full_name, avatar_url), owner:profiles!owner_id(id, name, full_name, avatar_url), conversation_messages(*)")
    .or(`tenant_id.eq.${profile.id},owner_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  let messages = (convData ?? []) as any[];

  if (messages.length === 0) {
    const { data: legacyMessages } = await supabase
      .from("messages")
      .select("*, sender:profiles!sender_id(id, full_name, avatar_url), receiver:profiles!receiver_id(id, full_name, avatar_url)")
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(50);
    messages = (legacyMessages ?? []) as any[];
  }

  // Group messages by conversation partner
  const conversations = new Map<
    string,
    {
      partnerId: string;
      partnerName: string;
      lastMessage: string;
      lastDate: string;
      isRead: boolean;
      unreadCount: number;
    }
  >();

  (messages ?? []).forEach((msg) => {
    const sender = msg.sender as unknown as { id: string; full_name: string | null };
    const receiver = msg.receiver as unknown as { id: string; full_name: string | null };

    const isMyMessage = msg.sender_id === profile.id;
    const partnerId = isMyMessage ? msg.receiver_id : msg.sender_id;
    const partnerName = isMyMessage
      ? (receiver?.full_name ?? "Utilisateur")
      : (sender?.full_name ?? "Utilisateur");

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partnerId,
        partnerName,
        lastMessage: msg.content,
        lastDate: msg.created_at,
        isRead: isMyMessage || msg.is_read,
        unreadCount: !isMyMessage && !msg.is_read ? 1 : 0,
      });
    } else {
      const existing = conversations.get(partnerId)!;
      if (!isMyMessage && !msg.is_read) {
        existing.unreadCount += 1;
      }
    }
  });

  const conversationList = Array.from(conversations.values());

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
        <p className="mt-1 text-neutral-600">
          {conversationList.length} conversation
          {conversationList.length !== 1 ? "s" : ""}
        </p>
      </div>

      {conversationList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <MessageSquare className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="text-lg font-medium text-neutral-900">
            Aucun message
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Vos conversations avec les propriétaires apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
          {conversationList.map((conv, i) => (
            <div
              key={conv.partnerId}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50",
                i !== 0 && "border-t border-[var(--border)]",
                !conv.isRead && "bg-primary-50/50"
              )}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                {conv.partnerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "truncate text-sm",
                      !conv.isRead
                        ? "font-bold text-neutral-900"
                        : "font-medium text-neutral-700"
                    )}
                  >
                    {conv.partnerName}
                  </p>
                  <span className="ml-2 flex-shrink-0 text-xs text-neutral-500">
                    {formatRelativeTime(conv.lastDate)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-neutral-500">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-600 px-2 text-xs font-bold text-white">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
