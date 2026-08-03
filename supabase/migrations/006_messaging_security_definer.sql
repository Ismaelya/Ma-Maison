-- ============================================================
-- Migration: SECURITY DEFINER functions for messaging limit
-- Replaces createAdminClient() privilege escalation in /api/messages
--
-- NOTE ON TYPES: Prisma generates String IDs stored as TEXT in Postgres.
-- subscriptions."userId" and messages."senderId" are TEXT columns.
-- The functions accept uuid (Supabase auth.uid() type) and cast to text
-- for comparison. The ::text cast is explicit to avoid silent mismatches.
-- ============================================================

-- 1. Check if the calling user has an active Premium subscription.
--    SECURITY DEFINER bypasses RLS on subscriptions (which restricts
--    users to reading their own rows). Returns ONLY a boolean — the caller
--    cannot extract any subscription data through this function.
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid);
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

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- 2. Count messages sent by a given user in the last 24 hours.
--    SECURITY DEFINER ensures the count is accurate regardless of any
--    row-level visibility the caller might have. Returns only an integer.
DROP FUNCTION IF EXISTS public.count_daily_messages(uuid);
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

REVOKE ALL ON FUNCTION public.count_daily_messages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_daily_messages(uuid) TO authenticated;

-- 3. Read conversation participants (server-side notification lookup only).
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
