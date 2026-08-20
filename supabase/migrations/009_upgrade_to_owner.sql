-- Migration 009: upgrade_to_owner SECURITY DEFINER function & trigger update

-- 1. Update prevent_role_status_escalation trigger function to recognize app.in_upgrade_to_owner
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
  if current_setting('app.in_upgrade_to_owner', true) = 'true' then
    if old.role = 'TENANT' and new.role = 'OWNER' and new.status is not distinct from old.status then
      return new;
    end if;
  end if;
  if not public.is_admin() then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      raise exception 'Modification de role/status réservée à un administrateur';
    end if;
  end if;
  return new;
end;
$function$;

-- 2. Create upgrade_to_owner function
CREATE OR REPLACE FUNCTION public.upgrade_to_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_current_role "UserRole";
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT role INTO v_current_role FROM profiles WHERE id = v_user_id;

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Profil introuvable';
  END IF;

  IF v_current_role != 'TENANT' THEN
    RAISE EXCEPTION 'Seuls les comptes Locataire peuvent devenir Propriétaire';
  END IF;

  PERFORM set_config('app.in_upgrade_to_owner', 'true', true);

  UPDATE profiles SET role = 'OWNER' WHERE id = v_user_id;

  INSERT INTO subscriptions (id, "userId", status, price, "startDate", "endDate", "createdAt")
  SELECT gen_random_uuid(), v_user_id, 'FREE', 0, now(), null, now()
  WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE "userId" = v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.upgrade_to_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upgrade_to_owner() TO authenticated;
