-- ============================================================
-- MA MAISON — Policies RLS + triggers Supabase (v1.1 Consolidé + AGENCY)
-- À exécuter comme migration Supabase, après avoir appliqué
-- le schema.prisma (prisma migrate) qui crée les tables.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SYNCHRONISATION auth.users → public.profiles
-- ------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, role, "agencyName", status, "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'role')::"UserRole", 'TENANT'),
    nullif(trim(new.raw_user_meta_data->>'agencyName'), ''),
    'ACTIVE',
    now(),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ------------------------------------------------------------
-- 2. TRIGGER : création automatique d'un abonnement TRIAL
--    pour tout nouveau profil OWNER ou AGENCY
-- ------------------------------------------------------------

create or replace function public.handle_new_owner_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role in ('OWNER', 'AGENCY') then
    insert into public.subscriptions (id, "userId", status, price, "startDate", "endDate", "createdAt")
    values (gen_random_uuid(), new.id, 'TRIAL', 1500, now(), now() + interval '30 days', now());

    update public.profiles set "trialStartedAt" = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_owner_created on public.profiles;
create trigger on_profile_owner_created
  after insert on public.profiles
  for each row execute function public.handle_new_owner_trial();

-- ------------------------------------------------------------
-- 3. TRIGGER : Payment.APPROVED → Subscription.ACTIVE (atomique)
--    Source de vérité unique — aucune logique équivalente côté app.
-- ------------------------------------------------------------

create or replace function public.handle_payment_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'APPROVED' and old.status is distinct from 'APPROVED' then

    if new."subscriptionId" is not null then
      update public.subscriptions
      set status = 'ACTIVE',
          "endDate" = now() + interval '30 days'
      where id = new."subscriptionId";
    else
      insert into public.subscriptions (id, "userId", status, price, "startDate", "endDate", "createdAt")
      values (gen_random_uuid(), new."userId", 'ACTIVE', new.amount, now(), now() + interval '30 days', now());
    end if;

    update public.profiles set "badgeVerified" = true where id = new."userId";

    insert into public.audit_logs (id, "actorId", action, "targetId", "createdAt")
    values (gen_random_uuid(), new."validatedBy", 'PAYMENT_APPROVED', new.id, now());
  end if;

  if new.status = 'REJECTED' and old.status is distinct from 'REJECTED' then
    insert into public.audit_logs (id, "actorId", action, "targetId", "createdAt")
    values (gen_random_uuid(), new."validatedBy", 'PAYMENT_REJECTED', new.id, now());
  end if;

  return new;
end;
$$;

drop trigger if exists on_payment_status_change on public.payments;
create trigger on_payment_status_change
  after update of status on public.payments
  for each row execute function public.handle_payment_approved();

-- ------------------------------------------------------------
-- 4. JOB QUOTIDIEN : expiration TRIAL et ACTIVE unifiée
-- ------------------------------------------------------------

create or replace function public.expire_subscriptions()
returns void
language sql
security definer
set search_path = public
as $$
  update public.subscriptions
  set status = 'EXPIRED'
  where status in ('TRIAL', 'ACTIVE')
    and "endDate" < now();
$$;

-- ------------------------------------------------------------
-- 5. FONCTION UTILITAIRE : rôle de l'utilisateur courant
-- ------------------------------------------------------------

create or replace function public.current_user_role()
returns "UserRole"
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()::text;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()::text) = 'ADMIN', false);
$$;

-- ------------------------------------------------------------
-- 6. ACTIVATION RLS — toutes les tables
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.favorites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

-- ------------------------------------------------------------
-- 7. PROFILES
-- ------------------------------------------------------------

drop policy if exists "profiles_select_own_or_public_fields" on public.profiles;
create policy "profiles_select_own_or_public_fields"
  on public.profiles for select
  using (id = auth.uid()::text or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

create or replace function public.prevent_role_status_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'Modification de role/status réservée à un administrateur';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_status on public.profiles;
create trigger guard_profile_role_status
  before update on public.profiles
  for each row execute function public.prevent_role_status_escalation();

drop policy if exists "profiles_admin_full_access" on public.profiles;
create policy "profiles_admin_full_access"
  on public.profiles for all
  using (public.is_admin());

-- ------------------------------------------------------------
-- 8. PROPERTIES
-- ------------------------------------------------------------

drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read"
  on public.properties for select
  using (
    status = 'APPROVED'
    and exists (
      select 1
      from public.profiles p
      left join public.subscriptions s
        on s."userId" = p.id and s.status in ('TRIAL', 'ACTIVE')
      where p.id = properties."ownerId"
        and p.status = 'ACTIVE'
        and s.id is not null
    )
  );

drop policy if exists "properties_owner_read_own" on public.properties;
create policy "properties_owner_read_own"
  on public.properties for select
  using ("ownerId" = auth.uid()::text);

drop policy if exists "properties_owner_insert" on public.properties;
create policy "properties_owner_insert"
  on public.properties for insert
  with check (
    "ownerId" = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()::text and p.role in ('OWNER', 'AGENCY') and p.status = 'ACTIVE'
    )
  );

drop policy if exists "properties_owner_update_delete" on public.properties;
create policy "properties_owner_update_delete"
  on public.properties for update
  using ("ownerId" = auth.uid()::text);

drop policy if exists "properties_owner_delete" on public.properties;
create policy "properties_owner_delete"
  on public.properties for delete
  using ("ownerId" = auth.uid()::text);

drop policy if exists "properties_admin_full_access" on public.properties;
create policy "properties_admin_full_access"
  on public.properties for all
  using (public.is_admin());

-- ------------------------------------------------------------
-- 9. PROPERTY_IMAGES / FAVORITES
-- ------------------------------------------------------------

drop policy if exists "property_images_read_if_property_visible" on public.property_images;
create policy "property_images_read_if_property_visible"
  on public.property_images for select
  using (
    exists (select 1 from public.properties pr where pr.id = property_images."propertyId")
  );

drop policy if exists "property_images_owner_write" on public.property_images;
create policy "property_images_owner_write"
  on public.property_images for all
  using (
    exists (
      select 1 from public.properties pr
      where pr.id = property_images."propertyId" and pr."ownerId" = auth.uid()::text
    )
  );

drop policy if exists "favorites_own_only" on public.favorites;
create policy "favorites_own_only"
  on public.favorites for all
  using ("userId" = auth.uid()::text);

-- ------------------------------------------------------------
-- 10. CONVERSATIONS / MESSAGES
-- ------------------------------------------------------------

drop policy if exists "conversations_participants_only" on public.conversations;
create policy "conversations_participants_only"
  on public.conversations for select
  using ("tenantId" = auth.uid()::text or "ownerId" = auth.uid()::text or public.is_admin());

drop policy if exists "conversations_tenant_create" on public.conversations;
create policy "conversations_tenant_create"
  on public.conversations for insert
  with check ("tenantId" = auth.uid()::text);

drop policy if exists "messages_participants_only" on public.messages;
create policy "messages_participants_only"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages."conversationId"
        and (c."tenantId" = auth.uid()::text or c."ownerId" = auth.uid()::text)
    )
  );

drop policy if exists "messages_participants_send" on public.messages;
create policy "messages_participants_send"
  on public.messages for insert
  with check (
    "senderId" = auth.uid()::text
    and exists (
      select 1 from public.conversations c
      where c.id = messages."conversationId"
        and (c."tenantId" = auth.uid()::text or c."ownerId" = auth.uid()::text)
    )
  );

-- ------------------------------------------------------------
-- 11. REVIEWS / REPORTS
-- ------------------------------------------------------------

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_author_write" on public.reviews;
create policy "reviews_author_write"
  on public.reviews for insert
  with check ("authorId" = auth.uid()::text);

drop policy if exists "reports_create_own" on public.reports;
create policy "reports_create_own"
  on public.reports for insert
  with check ("userId" = auth.uid()::text);

drop policy if exists "reports_admin_manage" on public.reports;
create policy "reports_admin_manage"
  on public.reports for all
  using (public.is_admin());

-- ------------------------------------------------------------
-- 12. SUBSCRIPTIONS / PAYMENTS
-- ------------------------------------------------------------

drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read"
  on public.subscriptions for select
  using ("userId" = auth.uid()::text or public.is_admin());

drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_write"
  on public.subscriptions for all
  using (public.is_admin());

drop policy if exists "payments_owner_read_create" on public.payments;
create policy "payments_owner_read_create"
  on public.payments for select
  using ("userId" = auth.uid()::text or public.is_admin());

drop policy if exists "payments_owner_create" on public.payments;
create policy "payments_owner_create"
  on public.payments for insert
  with check ("userId" = auth.uid()::text);

drop policy if exists "payments_admin_validate" on public.payments;
create policy "payments_admin_validate"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- 13. AUDIT_LOGS
-- ------------------------------------------------------------

drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read"
  on public.audit_logs for select
  using (public.is_admin());

-- ------------------------------------------------------------
-- 14. APP_SETTINGS
-- ------------------------------------------------------------

drop policy if exists "app_settings_authenticated_read" on public.app_settings;
create policy "app_settings_authenticated_read"
  on public.app_settings for select
  using (auth.uid() is not null);

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write"
  on public.app_settings for all
  using (public.is_admin());

-- ------------------------------------------------------------
-- 14. STORAGE — buckets receipts (privé) et property-images (public)
-- ------------------------------------------------------------

drop policy if exists "receipts_owner_only" on storage.objects;
create policy "receipts_owner_only"
  on storage.objects for all
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_admin_read" on storage.objects;
create policy "receipts_admin_read"
  on storage.objects for select
  using (bucket_id = 'receipts' and public.is_admin());

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "property_images_owner_write" on storage.objects;
create policy "property_images_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
