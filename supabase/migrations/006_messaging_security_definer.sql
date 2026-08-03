-- ============================================================
-- Migration: SECURITY DEFINER functions for messaging limit
-- Replaces createAdminClient() privilege escalation in /api/messages
--
-- TYPE DESIGN: Prisma String fields → TEXT columns in Postgres.
-- subscriptions."userId" and messages."senderId" are TEXT.
-- Functions accept TEXT parameters (matching the column types).
-- Callers pass user.id (string from Supabase Auth) directly.
-- ============================================================

-- 1. Check if a user has an active Premium subscription.
--    SECURITY DEFINER: bypasses subscriptions RLS (users can only see own rows).
--    Returns ONLY a boolean — callers cannot extract subscription data.
DROP FUNCTION IF EXISTS public.has_active_subscription(text);
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE "userId" = p_user_id
      AND status = 'ACTIVE'
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(text) TO authenticated;

-- 2. Count messages sent by a user in the last 24 hours.
--    SECURITY DEFINER: ensures the count is accurate regardless of
--    message-level RLS restrictions. Returns only an integer.
DROP FUNCTION IF EXISTS public.count_daily_messages(text);
CREATE OR REPLACE FUNCTION public.count_daily_messages(p_user_id text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE "senderId" = p_user_id
    AND "createdAt" > now() - interval '24 hours';
$$;

REVOKE ALL ON FUNCTION public.count_daily_messages(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_daily_messages(text) TO authenticated;

-- 3. Read conversation participants (server-side notification only).
--    Conversations.id is uuid in Prisma, so uuid parameter is correct here.
DROP FUNCTION IF EXISTS public.get_conversation_participants(uuid);
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
