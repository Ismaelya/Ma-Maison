-- =============================================================
-- Migration 007 — Mise en pause du mode Premium
-- Ajoute la colonne premiumEnabled (boolean) à la table singleton
-- app_settings, avec default true pour la compatibilité montante.
-- On l'initialise immédiatement à false pour activer la pause.
-- =============================================================

-- 1. Ajouter la colonne (nullable d'abord pour être sûr d'une migration propre)
alter table public.app_settings
  add column if not exists "premiumEnabled" boolean not null default true;

-- 2. Mettre à jour la ligne singleton pour désactiver Premium maintenant
update public.app_settings
  set "premiumEnabled" = false
  where id = 'singleton';

-- Si la ligne singleton n'existe pas encore, elle sera créée avec premiumEnabled = false
-- (Le seed applicatif s'en charge normalement, mais au cas où :)
insert into public.app_settings (id, "subscriptionPrice", "trialDurationDays", "paymentPhoneNumbers",
                                  "maxImagesPerListing", "maxImageSizeMb", "premiumEnabled", "updatedAt")
values ('singleton', 1500, 30,
        '{"wave": "+227 96 70 71 16", "amanata": "+227 96 70 71 16", "mynita": "+227 96 70 71 16"}'::jsonb,
        10, 5, false, now())
on conflict (id) do nothing;
