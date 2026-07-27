# Stratégie de Sauvegarde — Ma Maison (Supabase)

> **Dernière mise à jour** : Sprint 11 — Déploiement Production  
> **Responsable** : Admin plateforme (`ismaelyaoukdo@gmail.com`)

---

## 1. Sauvegardes automatiques Supabase

Supabase effectue des **backups automatiques quotidiens** sur le plan Free et Pro.

### Accès aux backups
1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet **Ma Maison** (`wvxojyoblzlvbedtorwq`)
3. Menu gauche → **Database** → **Backups**

### Plan Free (actuel)
- **Rétention** : 7 jours de backups automatiques
- **Fréquence** : 1 backup par jour (snapshot complet)
- **Point-in-time Recovery (PITR)** : Non disponible (Pro uniquement)
- **Restauration** : Via le dashboard Supabase (support requis)

### Plan Pro (recommandé pour la production)
- **Rétention** : 14 jours + PITR sur 7 jours
- **Fréquence** : WAL streaming continu (toutes les 5 minutes)
- **Restauration** : Self-service via dashboard

---

## 2. Backup manuel avant toute migration

### Avec pg_dump (recommandé)
```powershell
# Dans PowerShell — avant toute migration majeure
# Remplacer <password> par le mot de passe DB
$env:PGPASSWORD = "<password>"
pg_dump `
  "postgresql://postgres.wvxojyoblzlvbedtorwq:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" `
  --no-acl --no-owner `
  -f "backup_ma_maison_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Via Supabase CLI
```bash
# Backup complet via Supabase CLI
supabase db dump --db-url "postgresql://..." -f backup.sql
```

---

## 3. Checklist pré-migration

Avant toute migration de schéma (`prisma migrate deploy`, `prisma db push`, ou SQL manuel) :

- [ ] **Notifier les utilisateurs** (maintenance planifiée)
- [ ] **Déclencher un backup manuel** (`pg_dump` ci-dessus)
- [ ] **Vérifier le backup** : `psql < backup.sql` sur une base de test
- [ ] **Tester la migration** sur Supabase **Preview Branch** (si disponible)
- [ ] **Documenter le rollback** : que faire si la migration échoue
- [ ] **Appliquer la migration** en dehors des heures de pointe (nuit Niger, UTC+1)
- [ ] **Vérifier post-migration** : RLS, triggers, données

---

## 4. Procédure de restauration d'urgence

En cas de corruption ou perte de données :

1. **Identifier la cause** (erreur SQL ? hack ? migration échouée ?)
2. **Geler les écritures** : mettre l'app en mode maintenance (variable `NEXT_PUBLIC_MAINTENANCE_MODE=true`)
3. **Restaurer** via le dashboard Supabase → Backups → "Restore to point"
4. **Vérifier l'intégrité** des données restaurées
5. **Relancer l'app** et vérifier les fonctions critiques

---

## 5. Fichiers critiques à sauvegarder en dehors de la DB

Ces fichiers sont dans le repo Git — s'assurer que le repo est régulièrement pushé :

| Fichier | Rôle |
|---|---|
| `migration_init.sql` | Schéma initial complet |
| `supabase-rls-policies.sql` | Toutes les policies RLS et triggers |
| `supabase/migrations/005_consolidated_rls_and_triggers.sql` | Migration consolidée |
| `prisma/schema.prisma` | Schéma Prisma |

---

## 6. Restauration des variables d'environnement

En cas de perte des clés Supabase :
1. Supabase Dashboard → **Project Settings** → **API**
2. Récupérer `ANON KEY` et `SERVICE ROLE KEY`
3. Reconfigurer dans Vercel : **Project Settings** → **Environment Variables**
