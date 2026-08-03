-- ============================================================
-- Migration: SECURITY DEFINER functions for messaging limit
-- Replaces createAdminClient() privilege escalation in /api/messages
-- ============================================================

-- 1. Check if the calling user has an active Premium subscription.
--    SECURITY DEFINER allows reading subscriptions table regardless of RLS.
--    Returns true = Premium, false = Free tier.
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE "userId" = p_user_id::text
      AND status = 'ACTIVE'
  );
$$;

-- Grant execution to authenticated users only (not anon)
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- 2. Count messages sent by a given user in the last 24 hours.
--    SECURITY DEFINER ensures the count works even if message-level RLS
--    would restrict the select. This is a narrow, single-purpose function.
CREATE OR REPLACE FUNCTION public.count_daily_messages(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE "senderId" = p_user_id::text
    AND "createdAt" > now() - interval '24 hours';
$$;

-- Grant to authenticated users only
REVOKE ALL ON FUNCTION public.count_daily_messages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_daily_messages(uuid) TO authenticated;

-- 3. Read conversation participants (for notification lookup).
--    Called server-side to find the recipient; SECURITY DEFINER lets the
--    server read both tenantId and ownerId without exposing them to the sender.
CREATE OR REPLACE FUNCTION public.get_conversation_participants(p_conversation_id uuid)
RETURNS TABLE(tenant_id text, owner_id text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT "tenantId", "ownerId"
  FROM public.conversations
  WHERE id = p_conversation_id;
$$;

REVOKE ALL ON FUNCTION public.get_conversation_participants(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(uuid) TO authenticated;
