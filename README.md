# Ma-Maison — Plateforme Immobilière Web & PWA au Niger

**Ma Maison** est une plateforme immobilière moderne Web & PWA dédiée au marché nigérien (Niamey, Zinder, Maradi, Tahoua, Agadez, Diffa, Tillabéri, Dosso). Elle met en relation locataires, propriétaires et agences immobilières.

---

## 🚀 Stack Technique

- **Frontend** : Next.js 15 (App Router, Server Components par défaut), React 19, TypeScript strict
- **UI & Style** : Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons, Framer Motion
- **State Management** : TanStack Query (state serveur réactif), Zustand (state UI éphémère)
- **Formulaires & Validations** : React Hook Form + Zod
- **Backend & Base de données** : Supabase (Auth, PostgreSQL, Storage, Realtime) + Prisma ORM
- **i18n & Accessibilité** : `next-intl` (structure multilingue avec dictionnaire `messages/fr.json`)
- **Tests & QA** : Vitest (unitaires & intégration RLS), Playwright (E2E)

---

## 🛡️ Fonctionnalités Clés & Sécurité

- **Authentification Supabase Auth (`auth.users`)** : Source de vérité unique (Email + Mot de passe), synchronisation 1:1 avec `public.profiles` via trigger PostgreSQL.
- **Gestion des Rôles (RBAC)** : `TENANT` (locataire), `OWNER` (propriétaire), `AGENCY` (agence immobilière), `ADMIN` (administrateur).
- **Page d'authentification interactive (`AuthSlidingCard`)** : Panneau glissant animé (0.6s Framer Motion) avec switch responsive mobile.
- **Abonnements & Paiements Manuels** : Essai gratuit 30 jours (TRIAL) pour propriétaires & agences, puis abonnement Premium 1500 FCFA/mois via Amanata / Mynita / Wave. Activation automatique `Subscription.ACTIVE` + `badgeVerified = true` déclenchée de manière atomique par trigger Postgres `on_payment_status_change`.
- **Cycle de vie des annonces (`PropertyStatus`)** : `DRAFT` (brouillon) → `PENDING` (en attente modération) → `APPROVED` / `REJECTED`.
- **Messagerie Instantanée en Temps Réel (`ChatBox`)** : Canaux Supabase Realtime style WhatsApp.
- **Compression d'Images Client WebP (`ImageUploader`)** : Conversion HTML5 Canvas (max 1600px @ 80% WebP) réduisant la consommation de données mobiles de 70-90%.
- **Politiques RLS Strictes** : Envisagées dès la création sur toutes les tables (11 tables publiques + buckets storage `property-images` et `receipts`).

---

## 🛠️ Installation & Démarrage

```bash
# 1. Cloner le projet
git clone git@github.com:Ismaelya/Ma-Maison.git
cd Ma-Maison

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement (.env.local)
cp .env.example .env.local

# 4. Générer le client Prisma
npx prisma generate

# 5. Lancer le serveur de développement
npm run dev
```

---

## 🧪 Tests & Qualité du code

```bash
# Lancer les tests unitaires et RLS (52 tests)
npm test

# Lancer la vérification de type TypeScript strict
npx tsc --noEmit
```

---

© 2026 Ma Maison Niger — Tous droits réservés. Ismael Service Digital.
