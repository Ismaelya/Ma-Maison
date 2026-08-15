-- ============================================================
-- MA MAISON — Réconciliation schéma (fonctions, policies, triggers, grants)
-- Généré le 2026-08-05 par extraction directe de la base de production
-- (pg_get_functiondef / pg_policies / pg_get_triggerdef / information_schema).
--
-- CONTEXTE : les fichiers 005/006/007 et supabase-rls-policies.sql ont dérivé
-- de l'état réel de production (des correctifs ont été appliqués en base via
-- le SQL Editor sans être reportés dans les fichiers, et supabase-rls-policies.sql
-- contient des variantes jamais appliquées). Ce fichier reflète EXACTEMENT
-- l'état réel constaté en base au moment de la génération — c'est la nouvelle
-- source de vérité. Il est exécutable sur une base vierge (après prisma migrate)
-- et idempotent (create or replace / drop-then-create).
--
-- Ne remplace pas 005/006/007 dans l'historique (ne pas les supprimer), mais
-- toute divergence future doit se résoudre en faveur de CE fichier tant qu'il
-- n'est pas lui-même remplacé par une réconciliation plus récente.
--
-- Écarts trouvés lors de la réconciliation initiale, et leur résolution :
--
--   RÉSOLUS (appliqués en base + reflétés ci-dessous) :
--   - properties_owner_insert exigeait une souscription TRIAL/ACTIVE avec
--     "endDate" > now() — incompatible avec le modèle FREE (endDate = null).
--     Bloquait potentiellement toute création directe (hors Prisma) d'annonce
--     pour un propriétaire FREE. Corrigé : ne dépend plus que de ownerId +
--     rôle OWNER/AGENCY + compte ACTIVE.
--   - app_settings : RLS activée mais AUCUNE policy ni GRANT SELECT pour les
--     rôles anon/authenticated → 401 "permission denied" en pratique. Bug
--     confirmé en conditions réelles : /api/subscription/payment-request et
--     app/dashboard/abonnement et app/admin/paiements lisent tous app_settings
--     via le client authentifié standard (jamais service_role/Prisma), et
--     avalent l'erreur silencieusement (`const { data } = await supabase...`),
--     retombant sur des valeurs par défaut au lieu des vraies (notamment
--     premiumEnabled, censé bloquer les nouveaux abonnements Premium pendant
--     la pause — ne bloquait donc plus rien). Corrigé : GRANT SELECT (+
--     INSERT/UPDATE/DELETE pour la policy admin) à authenticated, policies
--     app_settings_authenticated_read / app_settings_admin_write créées.
--     Vérifié en conditions réelles : lecture authentifiée renvoie désormais
--     premiumEnabled=false (la vraie valeur), au lieu d'échouer silencieusement.
--   - expire_subscriptions() : un abonnement Premium (ACTIVE) expiré repasse
--     désormais en FREE (jamais un état bloquant), décision produit validée —
--     voir aussi app/api/cron/check-subscriptions/route.ts, aligné en miroir.
--   - is_approved_owner() / handle_new_auth_user() / properties_public_read
--     dans supabase-rls-policies.sql étaient stales par rapport à la base ;
--     synchronisés sur la version réelle (is_active_owner, liste blanche
--     TENANT/OWNER/AGENCY).
--   - receipts_owner_only / receipts_admin_read supprimées de 005 et
--     supabase-rls-policies.sql : bucket "receipts" jamais créé en prod,
--     aucune référence dans le code applicatif — superseded par
--     documents/payment-receipts (déjà repris ci-dessous depuis l'état réel).
--
--   TOUJOURS NON CORRIGÉS (documentés uniquement, hors périmètre) :
--   - is_admin() en base contient un bypass service_role supplémentaire absent
--     de tous les fichiers avant ce fichier (et rendu inopérant par un bug de
--     coalesce() — coalesce() retourne le premier argument non-NULL, donc les
--     branches service_role ne sont en pratique jamais atteintes tant que le
--     profil existe). Reproduit fidèlement tel quel ci-dessous ; à corriger
--     séparément si le bypass service_role est réellement nécessaire.
--   - `alter table public.notifications enable row level security` n'apparaît
--     dans aucun fichier avant celui-ci ; désormais inclus ci-dessous.
-- ============================================================


-- ------------------------------------------------------------
-- 1. FONCTIONS (état réel, 13 fonctions)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      select coalesce(
        (select role from public.profiles where id = auth.uid()::text) = 'ADMIN',
        auth.role() = 'service_role',
        current_setting('request.jwt.claim.role', true) = 'service_role',
        false
      );
    $function$;

CREATE OR REPLACE FUNCTION public.is_active_owner(owner_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.id = owner_id and p.status = 'ACTIVE'
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS "UserRole"
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.profiles where id = auth.uid()::text;
$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE "userId" = p_user_id
      AND status = 'ACTIVE'
  );
$function$;

CREATE OR REPLACE FUNCTION public.count_daily_messages(p_user_id text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE "senderId" = p_user_id
    AND "createdAt" > now() - interval '24 hours';
$function$;

CREATE OR REPLACE FUNCTION public.get_conversation_participants(p_conversation_id text)
 RETURNS TABLE(tenant_id text, owner_id text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT "tenantId", "ownerId"
  FROM public.conversations
  WHERE id = p_conversation_id;
$function$;

CREATE OR REPLACE FUNCTION public.increment_property_view(property_id text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        update public.properties set "viewCount" = "viewCount" + 1 where id = property_id;
      $function$;

-- Un abonnement Premium (ACTIVE) expiré retombe en FREE — jamais d'état
-- bloquant : cohérent avec le modèle Gratuit permanent (on ne perd que le
-- Premium, jamais l'accès de base). Miroir de /api/cron/check-subscriptions,
-- le vrai mécanisme d'expiration (cette fonction SQL n'est appelée par aucun
-- trigger ni pg_cron — pg_cron n'est pas installé sur ce projet).
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with expired as (
    update public.subscriptions
    set status = 'FREE',
        price = 0,
        "endDate" = null
    where status = 'ACTIVE'
      and "endDate" is not null
      and "endDate" < now()
    returning "userId"
  )
  update public.profiles
  set "badgeVerified" = false
  where id in (select "userId" from expired);
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, name, phone, role, "agencyName", status, "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_user_meta_data->>'role' in ('TENANT', 'OWNER', 'AGENCY')
        then (new.raw_user_meta_data->>'role')::"UserRole"
      else 'TENANT'::"UserRole"
    end,
    nullif(trim(new.raw_user_meta_data->>'agencyName'), ''),
    'ACTIVE',
    now(),
    now()
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.profiles 
  set status = 'DELETED',
      email = 'deleted-' || old.id::text || '@ma-maison.invalid'
  where id = old.id::text;

  update public.properties
  set status = 'HIDDEN'
  where "ownerId" = old.id::text and status = 'APPROVED';

  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_owner_trial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.role in ('OWNER', 'AGENCY') then
    insert into public.subscriptions (id, "userId", status, price, "startDate", "endDate", "createdAt")
    values (gen_random_uuid(), new.id, 'FREE', 0, now(), null, now());
  end if;
  return new;
end;
$function$;

-- Corrigé : cherchait l'abonnement à prolonger uniquement via
-- payment."subscriptionId" (toujours NULL en pratique — aucun code
-- applicatif ne le renseigne), donc créait systématiquement un NOUVEL
-- abonnement en doublon à chaque approbation au lieu de prolonger celui de
-- l'utilisateur. Cherche désormais par "userId", et prolonge depuis
-- GREATEST(now(), endDate actuel) au lieu de toujours now() (cohérent avec
-- PaymentService.approvePayment, qui ne duplique plus cette logique côté
-- application pour éviter une double prolongation +60j constatée en test réel).
CREATE OR REPLACE FUNCTION public.handle_payment_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sub_id text;
  v_current_end timestamp;
  v_base timestamp;
begin
  if new.status = 'APPROVED' and old.status is distinct from 'APPROVED' then

    select id, "endDate" into v_sub_id, v_current_end
    from public.subscriptions
    where "userId" = new."userId"
    order by "createdAt" desc
    limit 1;

    if v_sub_id is not null then
      v_base := greatest(now(), coalesce(v_current_end, now()));
      update public.subscriptions
      set status = 'ACTIVE',
          "endDate" = v_base + interval '30 days'
      where id = v_sub_id;
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
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_status_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.role() = 'service_role' or session_user = 'postgres' or auth.uid() is null then
    return new;
  end if;
  if not public.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'Modification de role/status réservée à un administrateur';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_property_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if auth.role() is null and session_user = 'postgres' then
    return new;
  end if;

  if not public.is_admin() then
    if new.status is distinct from old.status
      or new."ownerId" is distinct from old."ownerId"
      or new."isFeatured" is distinct from old."isFeatured"
    then
      raise exception 'Modification de status/ownerId/isFeatured reservee a un administrateur';
    end if;
  end if;
  return new;
end;
$function$;

-- ------------------------------------------------------------
-- 2. GRANTS explicites (les 3 RPC de messagerie sont restreintes à
--    `authenticated` ; toutes les autres fonctions gardent le défaut
--    Postgres — EXECUTE accordé à PUBLIC à la création — car elles sont
--    appelées depuis des policies RLS, y compris par le rôle anon).
-- ------------------------------------------------------------

REVOKE ALL ON FUNCTION public.has_active_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(text) TO authenticated;

REVOKE ALL ON FUNCTION public.count_daily_messages(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_daily_messages(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_conversation_participants(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(text) TO authenticated;

-- app_settings n'avait ni GRANT ni policy pour anon/authenticated (bug
-- confirmé : lecture authentifiée retournait 401 "permission denied").
GRANT SELECT ON public.app_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;

-- ------------------------------------------------------------
-- 3. ACTIVATION RLS — 13 tables (12 déjà dans 005 + notifications,
--    absente de tous les fichiers existants alors qu'active en prod)
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.properties add column if not exists "whatsappNumber" text;
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
alter table public.notifications enable row level security;

-- ------------------------------------------------------------
-- 4. POLICIES (44 policies — public + storage.objects, incluant les 2
--    policies app_settings ajoutées pour corriger le bug de lecture ci-dessus)
-- ------------------------------------------------------------

-- app_settings
drop policy if exists "app_settings_authenticated_read" on public.app_settings;
create policy "app_settings_authenticated_read"
  on public.app_settings for select
  using (auth.uid() is not null);

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- audit_logs
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read"
  on public.audit_logs for SELECT
  using (is_admin());

-- conversations
drop policy if exists "conversations_participants_only" on public.conversations;
create policy "conversations_participants_only"
  on public.conversations for SELECT
  using ((("tenantId" = (auth.uid())::text) OR ("ownerId" = (auth.uid())::text) OR is_admin()));

drop policy if exists "conversations_participants_update" on public.conversations;
create policy "conversations_participants_update"
  on public.conversations for UPDATE
  using ((("tenantId" = (auth.uid())::text) OR ("ownerId" = (auth.uid())::text) OR is_admin()))
  with check ((("tenantId" = (auth.uid())::text) OR ("ownerId" = (auth.uid())::text) OR is_admin()));

drop policy if exists "conversations_tenant_create" on public.conversations;
create policy "conversations_tenant_create"
  on public.conversations for INSERT
  with check (("tenantId" = (auth.uid())::text));

-- favorites
drop policy if exists "favorites_own_only" on public.favorites;
create policy "favorites_own_only"
  on public.favorites for ALL
  using (("userId" = (auth.uid())::text))
  with check (("userId" = (auth.uid())::text));

-- messages
drop policy if exists "messages_participants_only" on public.messages;
create policy "messages_participants_only"
  on public.messages for SELECT
  using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages."conversationId") AND ((c."tenantId" = (auth.uid())::text) OR (c."ownerId" = (auth.uid())::text))))));

drop policy if exists "messages_participants_send" on public.messages;
create policy "messages_participants_send"
  on public.messages for INSERT
  with check ((("senderId" = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages."conversationId") AND ((c."tenantId" = (auth.uid())::text) OR (c."ownerId" = (auth.uid())::text)))))));

drop policy if exists "messages_participants_update" on public.messages;
create policy "messages_participants_update"
  on public.messages for UPDATE
  using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages."conversationId") AND ((c."tenantId" = (auth.uid())::text) OR (c."ownerId" = (auth.uid())::text) OR is_admin())))));

-- notifications
drop policy if exists "notifications_insert_system" on public.notifications;
create policy "notifications_insert_system"
  on public.notifications for INSERT
  with check (is_admin());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for SELECT
  using ((("userId" = (auth.uid())::text) OR is_admin()));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for UPDATE
  using (("userId" = (auth.uid())::text))
  with check (("userId" = (auth.uid())::text));

-- payments
drop policy if exists "payments_admin_validate" on public.payments;
create policy "payments_admin_validate"
  on public.payments for UPDATE
  using (is_admin())
  with check (is_admin());

drop policy if exists "payments_owner_create" on public.payments;
create policy "payments_owner_create"
  on public.payments for INSERT
  with check (("userId" = (auth.uid())::text));

drop policy if exists "payments_owner_read_create" on public.payments;
create policy "payments_owner_read_create"
  on public.payments for SELECT
  using ((("userId" = (auth.uid())::text) OR is_admin()));

-- profiles
drop policy if exists "profiles_admin_full_access" on public.profiles;
create policy "profiles_admin_full_access"
  on public.profiles for ALL
  using (is_admin());

drop policy if exists "profiles_select_own_or_public_fields" on public.profiles;
create policy "profiles_select_own_or_public_fields"
  on public.profiles for SELECT
  using (((id = (auth.uid())::text) OR is_admin() OR (EXISTS ( SELECT 1
   FROM properties pr
  WHERE ((pr."ownerId" = profiles.id) AND (pr.status = 'APPROVED'::"PropertyStatus"))))));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for UPDATE
  using ((id = (auth.uid())::text))
  with check ((id = (auth.uid())::text));

-- properties
drop policy if exists "properties_admin_full_access" on public.properties;
create policy "properties_admin_full_access"
  on public.properties for ALL
  using (is_admin());

drop policy if exists "properties_owner_delete" on public.properties;
create policy "properties_owner_delete"
  on public.properties for DELETE
  using (("ownerId" = (auth.uid())::text));

-- Corrigé : plus de condition d'abonnement, cohérent avec le modèle FREE et
-- avec properties_public_read (is_active_owner). Uniquement ownerId + rôle
-- OWNER/AGENCY + compte ACTIVE.
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

drop policy if exists "properties_owner_read_own" on public.properties;
create policy "properties_owner_read_own"
  on public.properties for SELECT
  using (("ownerId" = (auth.uid())::text));

drop policy if exists "properties_owner_update_delete" on public.properties;
create policy "properties_owner_update_delete"
  on public.properties for UPDATE
  using (("ownerId" = (auth.uid())::text))
  with check (("ownerId" = (auth.uid())::text));

drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read"
  on public.properties for SELECT
  using (((status = 'APPROVED'::"PropertyStatus") AND is_active_owner("ownerId")));

-- property_images
drop policy if exists "property_images_owner_write" on public.property_images;
create policy "property_images_owner_write"
  on public.property_images for ALL
  using ((EXISTS ( SELECT 1
   FROM properties pr
  WHERE ((pr.id = property_images."propertyId") AND (pr."ownerId" = (auth.uid())::text)))));

-- Corrigé : vérifiait seulement l'existence de la propriété parente, pas son
-- status='APPROVED' ni le compte actif du propriétaire — les images d'annonces
-- PENDING/REJECTED ou d'un compte suspendu étaient publiquement lisibles.
-- Aligné sur properties_public_read (+ is_admin() pour la modération).
drop policy if exists "property_images_read_if_property_visible" on public.property_images;
create policy "property_images_read_if_property_visible"
  on public.property_images for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.properties pr
      where pr.id = property_images."propertyId"
        and pr.status = 'APPROVED'
        and public.is_active_owner(pr."ownerId")
    )
  );

-- reports
drop policy if exists "reports_admin_manage" on public.reports;
create policy "reports_admin_manage"
  on public.reports for ALL
  using (is_admin());

drop policy if exists "reports_create_own" on public.reports;
create policy "reports_create_own"
  on public.reports for INSERT
  with check (("userId" = (auth.uid())::text));

drop policy if exists "reports_user_read_own" on public.reports;
create policy "reports_user_read_own"
  on public.reports for SELECT
  using ((("userId" = (auth.uid())::text) OR is_admin()));

-- reviews
drop policy if exists "reviews_author_delete" on public.reviews;
create policy "reviews_author_delete"
  on public.reviews for DELETE
  using ((("authorId" = (auth.uid())::text) OR is_admin()));

drop policy if exists "reviews_author_update_delete" on public.reviews;
create policy "reviews_author_update_delete"
  on public.reviews for UPDATE
  using ((("authorId" = (auth.uid())::text) OR is_admin()));

drop policy if exists "reviews_author_write" on public.reviews;
create policy "reviews_author_write"
  on public.reviews for INSERT
  with check (("authorId" = (auth.uid())::text));

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for SELECT
  using (true);

-- subscriptions
drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_write"
  on public.subscriptions for ALL
  using (is_admin());

drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read"
  on public.subscriptions for SELECT
  using ((("userId" = (auth.uid())::text) OR is_admin()));

-- storage.objects
-- NOTE : buckets réels en prod = avatars (public), property-images (public),
-- documents (privé), payment-receipts (privé). Le bucket 'receipts' référencé
-- dans 005/supabase-rls-policies.sql n'existe PAS en prod.
drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write"
  on storage.objects for INSERT
  with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for SELECT
  using ((bucket_id = 'avatars'::text));

drop policy if exists "documents_admin_read" on storage.objects;
create policy "documents_admin_read"
  on storage.objects for SELECT
  using (((bucket_id = 'documents'::text) AND is_admin()));

drop policy if exists "documents_owner_only" on storage.objects;
create policy "documents_owner_only"
  on storage.objects for ALL
  using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

drop policy if exists "payment_receipts_admin_read" on storage.objects;
create policy "payment_receipts_admin_read"
  on storage.objects for SELECT
  using (((bucket_id = 'payment-receipts'::text) AND is_admin()));

drop policy if exists "payment_receipts_owner_only" on storage.objects;
create policy "payment_receipts_owner_only"
  on storage.objects for ALL
  using (((bucket_id = 'payment-receipts'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

drop policy if exists "property_images_owner_write" on storage.objects;
create policy "property_images_owner_write"
  on storage.objects for INSERT
  with check (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
  on storage.objects for SELECT
  using ((bucket_id = 'property-images'::text));

-- ------------------------------------------------------------
-- 5. TRIGGERS applicatifs (état réel — 5 triggers ; les triggers internes
--    Supabase sur storage.* et realtime.* sont gérés par la plateforme et
--    ne sont pas reproduits ici)
-- ------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_auth_user_deleted();

drop trigger if exists on_profile_owner_created on public.profiles;
create trigger on_profile_owner_created
  after insert on public.profiles
  for each row execute function public.handle_new_owner_trial();

drop trigger if exists guard_profile_role_status on public.profiles;
create trigger guard_profile_role_status
  before update on public.profiles
  for each row execute function public.prevent_role_status_escalation();

drop trigger if exists guard_property_privilege_escalation on public.properties;
create trigger guard_property_privilege_escalation
  before update on public.properties
  for each row execute function public.prevent_property_privilege_escalation();

drop trigger if exists on_payment_status_change on public.payments;
create trigger on_payment_status_change
  after update of status on public.payments
  for each row execute function public.handle_payment_approved();

-- ------------------------------------------------------------
-- 6. AJOUT 2026-08-11 — Type de bien "Résidence", meublé, période de
--    location. Appliqué directement en base via scratch/apply_residence_
--    furnished_rental_migration.ts (le CLI `prisma migrate dev` échoue par
--    timeout réseau sur le pooler Supabase, comme d'habitude sur ce projet),
--    et miroir de prisma/migrations/20260811190000_add_residence_furnished_
--    rental_period/migration.sql. Reporté ici pour que ce fichier reste la
--    photographie exacte de l'état réel de production. Idempotent.
-- ------------------------------------------------------------

ALTER TYPE "PropertyType" ADD VALUE IF NOT EXISTS 'RESIDENCE';

DO $$ BEGIN
  CREATE TYPE "RentalPeriod" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "furnished" boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "rentalPeriod" "RentalPeriod";

-- ------------------------------------------------------------
-- 7. AJOUT 2026-08-12 — Disponibilité des annonces (PropertyAvailability:
--    AVAILABLE, UNAVAILABLE, SOLD) gérée par le propriétaire.
-- ------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "PropertyAvailability" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'SOLD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "availability" "PropertyAvailability" NOT NULL DEFAULT 'AVAILABLE';

-- ------------------------------------------------------------
-- 8. AJOUT 2026-08-13 — Colonne receiverId sur la table messages
--    pour le décompte direct et temps réel des messages non lus.
-- ------------------------------------------------------------

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "receiverId" text;

UPDATE public.messages m 
SET "receiverId" = CASE 
  WHEN m."senderId" = c."tenantId" THEN c."ownerId" 
  ELSE c."tenantId" 
END
FROM public.conversations c 
WHERE c.id = m."conversationId" AND m."receiverId" IS NULL;

ALTER TABLE public.messages ALTER COLUMN "receiverId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "messages_receiverId_idx" ON public.messages ("receiverId");

