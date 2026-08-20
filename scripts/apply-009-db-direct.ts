import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Direct DB connection URL for Supabase (using direct host db.<project_ref>.supabase.co:5432)
const directDbUrl = "postgresql://postgres.wvxojyoblzlvbedtorwq:Z%40karia2%40%4072%4022@db.wvxojyoblzlvbedtorwq.supabase.co:5432/postgres?sslmode=require&connect_timeout=15";

console.log('Connecting via direct DB URL db.wvxojyoblzlvbedtorwq.supabase.co:5432 ...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directDbUrl,
    },
  },
});

async function main() {
  const statements = [
    `CREATE OR REPLACE FUNCTION public.prevent_role_status_escalation()
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
    $function$;`,

    `CREATE OR REPLACE FUNCTION public.upgrade_to_owner()
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
    $$;`,

    `REVOKE ALL ON FUNCTION public.upgrade_to_owner() FROM PUBLIC;`,
    `GRANT EXECUTE ON FUNCTION public.upgrade_to_owner() TO authenticated;`
  ];

  for (let i = 0; i < statements.length; i++) {
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    await prisma.$executeRawUnsafe(statements[i]!);
  }
  console.log('✅ Migration 009 applied successfully!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error applying migration 009:', e);
  await prisma.$disconnect();
  process.exit(1);
});
