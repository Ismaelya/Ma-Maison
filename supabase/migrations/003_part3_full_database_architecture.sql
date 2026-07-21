-- ============================================================================
-- Ma Maison — Migration 003: Complete Database Architecture (v1.1 Part 3)
-- ============================================================================

-- Create / recreate Enums
DO $$ BEGIN
  CREATE TYPE public.user_role_v3 AS ENUM ('TENANT', 'OWNER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status_v3 AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status_v3 AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_v3 AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method_v3 AS ENUM ('AMANATA', 'MYNITA', 'WAVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.property_status_v3 AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'DELETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.property_type_v3 AS ENUM ('HOUSE', 'APARTMENT', 'ROOM', 'VILLA', 'OFFICE', 'SHOP', 'LAND');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status_v3 AS ENUM ('OPEN', 'IN_REVIEW', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Update profiles table columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  type        public.property_type_v3 NOT NULL,
  price       INTEGER NOT NULL CHECK (price > 0),
  city        TEXT NOT NULL,
  district    TEXT NOT NULL,
  address     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  rooms       INTEGER NOT NULL CHECK (rooms >= 0),
  bathrooms   INTEGER NOT NULL CHECK (bathrooms >= 0),
  surface     INTEGER CHECK (surface > 0),
  status      public.property_status_v3 NOT NULL DEFAULT 'PENDING',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_district ON public.properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_composite_search ON public.properties(city, type, price);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Property Images table
CREATE TABLE IF NOT EXISTS public.property_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  "order"     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Messages table (linked to Conversation)
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(content) > 0),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_sender_id ON public.conversation_messages(sender_id);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reports table
CREATE TABLE IF NOT EXISTS public.property_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (length(reason) > 0),
  status      public.report_status_v3 NOT NULL DEFAULT 'OPEN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prop_reports_property_id ON public.property_reports(property_id);

ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ATOMIC PAYMENT APPROVAL TRIGGER (SECTION 22)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_payment_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    -- 1. Update Profile badge_verified and subscription_status
    UPDATE public.profiles
    SET badge_verified = true,
        subscription_status = 'active'
    WHERE id = NEW.owner_id OR id = NEW.user_id;

    -- 2. Update linked subscription to ACTIVE and extend 30 days
    IF NEW.subscription_id IS NOT NULL THEN
      UPDATE public.subscriptions
      SET status = 'active',
          expires_at = now() + INTERVAL '30 days'
      WHERE id = NEW.subscription_id;
    ELSE
      -- Or update latest subscription for this owner
      UPDATE public.subscriptions
      SET status = 'active',
          expires_at = now() + INTERVAL '30 days'
      WHERE owner_id = NEW.owner_id OR user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_payment_approved ON public.payments;

CREATE TRIGGER trigger_on_payment_approved
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_payment_approved();

-- ============================================================================
-- RLS POLICIES (SECTION 27)
-- ============================================================================

-- properties RLS: Public SELECT if status = 'APPROVED' AND active owner with non-expired subscription
DROP POLICY IF EXISTS "Public select properties" ON public.properties;

CREATE POLICY "Public select properties"
  ON public.properties FOR SELECT
  TO anon, authenticated
  USING (
    status = 'APPROVED'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.subscriptions s ON (s.owner_id = p.id OR s.user_id = p.id) AND s.status IN ('trial', 'active')
      WHERE p.id = properties.owner_id
        AND p.account_status = 'active'
        AND s.id IS NOT NULL
    )
  );

-- Owner property write policies
CREATE POLICY "Owner insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_status = 'active'
      AND profiles.subscription_status != 'expired'
    )
  );

CREATE POLICY "Owner update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- property_images RLS: Inherits from properties SELECT policy
CREATE POLICY "Public select property_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'properties');

CREATE POLICY "Public select property_images table"
  ON public.property_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_images.property_id
    )
  );

CREATE POLICY "Owner insert property_images"
  ON public.property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Conversations RLS: Participants only
CREATE POLICY "Participants select conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

CREATE POLICY "Tenants insert conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

-- Messages RLS: Participants only via conversation
CREATE POLICY "Participants select messages"
  ON public.conversation_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND (conversations.tenant_id = auth.uid() OR conversations.owner_id = auth.uid())
    )
  );

CREATE POLICY "Participants insert messages"
  ON public.conversation_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND (conversations.tenant_id = auth.uid() OR conversations.owner_id = auth.uid())
    )
  );

-- Reviews RLS: Public SELECT, Single authenticated author INSERT
CREATE POLICY "Public select reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authors insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Property Reports RLS: Authenticated user INSERT, Admin SELECT/UPDATE
CREATE POLICY "Users insert property_reports"
  ON public.property_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage property_reports"
  ON public.property_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.account_status = 'active'
    )
  );
