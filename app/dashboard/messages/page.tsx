import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Building2 } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { MessageService } from "@/lib/messaging/message.service";
import { formatRelativeTime, cn, getAvatarUrl } from "@/lib/utils";
import { ChatBox } from "@/components/dashboard/chat-box";

export const metadata: Metadata = {
  title: "Messages",
};

type SearchParams = Promise<{
  conv?: string;
}>;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile } = await requireAuth();
  const params = await searchParams;

  // Get conversations for current user using official MessageService
  const rawConversations = await MessageService.getConversations(profile.id);

  const formattedConversations = rawConversations.map((conv: any) => {
    const isTenant = conv.tenantId === profile.id;
    const partner = isTenant ? conv.owner : conv.tenant;
    const partnerName = partner?.name || "Utilisateur";
    const partnerAvatar = partner?.avatarUrl || partner?.avatar_url || null;
    const messages = Array.isArray(conv.messages) ? conv.messages : [];

    // Sort messages chronologically
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime()
    );

    const lastMsg = sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1] : null;

    const unreadCount = conv.unreadCount || 0;

    return {
      id: conv.id,
      propertyId: conv.propertyId || conv.property_id,
      propertyTitle: conv.property?.title ?? "Bien immobilier",
      partnerId: isTenant ? conv.ownerId : conv.tenantId,
      partnerName,
      partnerAvatar,
      lastMessage: lastMsg?.content ?? "Nouvelle conversation",
      lastDate: lastMsg?.createdAt || lastMsg?.created_at || conv.createdAt || conv.created_at,
      messages: sortedMessages,
      unreadCount,
    };
  });

  const firstConv = formattedConversations[0];
  const selectedConvId = params.conv || (firstConv ? firstConv.id : null);
  const activeConversation = formattedConversations.find((c) => c.id === selectedConvId) || firstConv;

  // Mark active conversation unread messages as read when viewed
  if (activeConversation && activeConversation.unreadCount > 0) {
    await MessageService.markAsRead(activeConversation.id, profile.id);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Messagerie</h1>
        <p className="mt-1 text-neutral-600">
          {formattedConversations.length} conversation
          {formattedConversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {formattedConversations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <MessageSquare className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="text-lg font-medium text-neutral-900">
            Aucun message
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Vos conversations avec les propriétaires et locataires apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Conversation List Sidebar */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-card)]">
              {formattedConversations.map((conv) => {
                const isSelected = conv.id === activeConversation?.id;
                // If it's selected and we just marked it read above, visually show unreadCount as 0 for active conversation
                const displayUnread = isSelected ? 0 : conv.unreadCount;

                return (
                  <Link
                    key={conv.id}
                    href={`/dashboard/messages?conv=${conv.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 transition-colors relative",
                      isSelected
                        ? "bg-primary-50 text-primary-900 border border-primary-200"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 shadow-sm">
                      <img src={getAvatarUrl(conv.partnerAvatar, conv.partnerName)} alt={conv.partnerName} className="h-full w-full rounded-full object-cover" />
                      {displayUnread > 0 && (
                        <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={cn("truncate text-sm text-neutral-900", displayUnread > 0 ? "font-bold" : "font-semibold")}>
                          {conv.partnerName}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">
                            {formatRelativeTime(conv.lastDate)}
                          </span>
                          {displayUnread > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {displayUnread > 9 ? "9+" : displayUnread}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={cn("truncate text-xs mt-0.5", displayUnread > 0 ? "font-semibold text-neutral-900" : "text-neutral-500")}>
                        {conv.lastMessage}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{conv.propertyTitle}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Active Conversation ChatBox */}
          <div className="lg:col-span-7">
            {activeConversation ? (
              <ChatBox
                currentUserId={profile.id}
                partnerId={activeConversation.partnerId}
                partnerName={activeConversation.partnerName}
                partnerAvatar={activeConversation.partnerAvatar}
                conversationId={activeConversation.id}
                initialMessages={activeConversation.messages}
              />
            ) : (
              <div className="flex h-[400px] items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-neutral-400 text-sm">
                Sélectionnez une conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
