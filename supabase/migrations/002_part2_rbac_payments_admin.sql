-- ============================================================================
-- Ma Maison — Migration 002: RBAC, Payments & Admin Moderation
-- ============================================================================

-- Create new Enums
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status_v2 AS ENUM ('trial', 'active', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status_v2 NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS badge_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount          INTEGER NOT NULL DEFAULT 1500 CHECK (amount > 0),
  provider        TEXT NOT NULL CHECK (provider IN ('wave', 'amanata', 'mynita')),
  receipt_url     TEXT NOT NULL,
  status          public.payment_status NOT NULL DEFAULT 'pending',
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_owner_id ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments RLS Policies
CREATE POLICY "Owners can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can submit pending payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_status = 'active'
    )
  );

CREATE POLICY "Admins can view and manage all payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.account_status = 'active'
    )
  );

-- Create reports (signalements) table
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (length(reason) > 0),
  details     TEXT,
  status      public.report_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_listing_id ON public.reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reports RLS Policies
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view and manage all reports"
  ON public.reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.account_status = 'active'
    )
  );

-- Update RLS on listings to check account_status = 'active' AND subscription_status != 'expired'
DROP POLICY IF EXISTS "Public can view active published listings" ON public.listings;

CREATE POLICY "Public can view active published listings"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = listings.owner_id
      AND profiles.account_status = 'active'
      AND profiles.subscription_status != 'expired'
    )
  );

-- Admin can manage all listings
CREATE POLICY "Admins can manage all listings"
  ON public.listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.account_status = 'active'
    )
  );

-- Admin can manage all profiles
CREATE POLICY "Admins can view and manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.account_status = 'active'
    )
  );

-- Private receipts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Receipts Storage Policies
CREATE POLICY "Owners can upload payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can view own payment receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.account_status = 'active'
      )
    )
  );

-- Updated trial expiration trigger function
CREATE OR REPLACE FUNCTION public.expire_owner_trials()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET subscription_status = 'expired'
  WHERE role = 'owner'
    AND subscription_status = 'trial'
    AND trial_started_at IS NOT NULL
    AND trial_started_at + INTERVAL '30 days' < now()
    AND NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.owner_id = profiles.id
      AND subscriptions.status = 'active'
      AND subscriptions.expires_at > now()
    );

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
