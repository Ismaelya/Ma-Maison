-- Migration 004: Audit Logs Table (Part 5 Section 61)

DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM (
    'LOGIN',
    'PAYMENT_APPROVED',
    'PAYMENT_REJECTED',
    'PROPERTY_DELETED',
    'PROPERTY_APPROVED',
    'PROPERTY_REJECTED',
    'ACCOUNT_SUSPENDED',
    'ADMIN_ACTION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can record audit logs" ON public.audit_logs;

-- Policy: SELECT restricted to ADMIN role
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'admin')
    )
  );

-- Policy: INSERT allowed for authenticated users / server actions
CREATE POLICY "Authenticated users can record audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
