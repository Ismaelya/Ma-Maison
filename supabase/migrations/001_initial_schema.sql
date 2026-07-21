-- ============================================================================
-- Ma Maison — Initial Database Schema
-- ============================================================================
-- RULE: RLS is enabled on EVERY table at creation. No exceptions.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE public.user_role AS ENUM ('tenant', 'owner', 'admin');
CREATE TYPE public.user_status AS ENUM ('active', 'expired', 'suspended');
CREATE TYPE public.property_type AS ENUM ('apartment', 'house', 'studio', 'land', 'commercial');
CREATE TYPE public.transaction_type AS ENUM ('rent', 'sale');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- ============================================================================
-- TABLE: profiles
-- Synced from auth.users via trigger. This is the ONLY identity table Prisma
-- and the app consume. Never duplicate auth.users.
-- ============================================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          public.user_role NOT NULL DEFAULT 'tenant',
  status        public.user_status NOT NULL DEFAULT 'active',
  trial_started_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles (needed for listing owner info)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous users can view basic profile info (for public listing pages)
CREATE POLICY "Anonymous can view profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles are created only via the trigger (service_role)
-- No direct INSERT policy for authenticated users
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- TABLE: listings
-- ============================================================================

CREATE TABLE public.listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  property_type   public.property_type NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  price           INTEGER NOT NULL CHECK (price > 0),
  city            TEXT NOT NULL,
  neighborhood    TEXT,
  address         TEXT,
  bedrooms        SMALLINT CHECK (bedrooms >= 0),
  bathrooms       SMALLINT CHECK (bathrooms >= 0),
  area_sqm        INTEGER CHECK (area_sqm > 0),
  amenities       TEXT[] DEFAULT '{}',
  images          TEXT[] DEFAULT '{}',
  is_published    BOOLEAN NOT NULL DEFAULT true,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_owner_id ON public.listings(owner_id);
CREATE INDEX idx_listings_city ON public.listings(city);
CREATE INDEX idx_listings_property_type ON public.listings(property_type);
CREATE INDEX idx_listings_transaction_type ON public.listings(transaction_type);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_is_published ON public.listings(is_published);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- PUBLIC SELECT: Anyone can view published listings ONLY if the owner is NOT expired.
-- This is the critical trial enforcement at the database level.
CREATE POLICY "Public can view active published listings"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = listings.owner_id
      AND profiles.status != 'expired'
    )
  );

-- Owners can always see their own listings (even if expired, for management)
CREATE POLICY "Owners can view own listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Only non-expired owners can create listings
CREATE POLICY "Active owners can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.status != 'expired'
    )
  );

-- Owners can update their own listings
CREATE POLICY "Owners can update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their own listings
CREATE POLICY "Owners can delete own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ============================================================================
-- TABLE: favorites
-- ============================================================================

CREATE TABLE public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON public.favorites(listing_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: messages
-- ============================================================================

CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  content     TEXT NOT NULL CHECK (length(content) > 0),
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_listing_id ON public.messages(listing_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can only view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Any authenticated user can send messages (sender must be themselves)
CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Only the receiver can update messages (mark as read)
CREATE POLICY "Receivers can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================

CREATE TABLE public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      public.subscription_status NOT NULL DEFAULT 'pending',
  provider    TEXT NOT NULL CHECK (provider IN ('wave', 'amanata', 'mynita')),
  amount      INTEGER NOT NULL DEFAULT 1500 CHECK (amount > 0),
  starts_at   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_owner_id ON public.subscriptions(owner_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can only view their own subscriptions
CREATE POLICY "Owners can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Subscriptions are managed by service_role only (via Edge Functions after payment)
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Sync new auth.users → public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set trial_started_at when a user becomes an owner
CREATE OR REPLACE FUNCTION public.handle_owner_trial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'owner' AND OLD.role != 'owner' AND NEW.trial_started_at IS NULL THEN
    NEW.trial_started_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_owner_trial_start
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_owner_trial();

-- ============================================================================
-- TRIAL EXPIRATION (pg_cron)
-- Runs daily at 2:00 AM UTC. Marks owners as expired if:
--   1. They have role = 'owner'
--   2. Their status is 'active'
--   3. trial_started_at + 30 days < now()
--   4. They have NO active subscription
-- ============================================================================

CREATE OR REPLACE FUNCTION public.expire_owner_trials()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET status = 'expired'
  WHERE role = 'owner'
    AND status = 'active'
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

-- Schedule the cron job (runs at 2:00 AM UTC daily)
SELECT cron.schedule(
  'expire-owner-trials',
  '0 2 * * *',
  'SELECT public.expire_owner_trials()'
);

-- ============================================================================
-- STORAGE BUCKETS (for listing images and avatars)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listings', 'listings', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Anyone can view public bucket files
CREATE POLICY "Public can view listing images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'listings');

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Only authenticated users can upload to listings bucket
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listings');

-- Only the uploader can delete their listing images
CREATE POLICY "Users can delete own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only authenticated users can upload avatars (to their own folder)
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
