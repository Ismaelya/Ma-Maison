-- ============================================================
-- 010_profiles_public_view.sql
-- Fixes PII exposure (audit finding A5): RLS is row-level only,
-- it cannot restrict which COLUMNS anon sees. The existing
-- "profiles_select_own_or_public_fields" policy lets anon read
-- entire profile rows (email, phone, ...) for any owner with an
-- APPROVED listing, via a direct PostgREST call with the public
-- anon key — independent of what the app UI chooses to display.
--
-- Fix: revoke anon's direct SELECT on public.profiles, and expose
-- only the safe, actually-public fields through a view. Public
-- joins (search results, listing detail owner card) must read
-- from this view, never from public.profiles, for anonymous users.
-- ============================================================

revoke select on public.profiles from anon;

create or replace view public.profiles_public as
select
  id,
  name,
  "avatarUrl",
  "agencyName",
  "badgeVerified"
from public.profiles;

grant select on public.profiles_public to anon, authenticated;
