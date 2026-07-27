# Ma Maison — Déploiement Vercel
# Sprint 11 — Mise en production

## Étapes pour déployer Ma Maison sur Vercel

### 1. Connexion à Vercel (à faire UNE SEULE FOIS)
```powershell
npx vercel login
# Ouvrir le lien dans le navigateur et s'authentifier
```

### 2. Lier le projet au compte Vercel
```powershell
npx vercel link
# Répondre : "Yes" pour lier à votre compte
# Scope : votre compte Vercel
# Lier à projet existant ? Non (premier déploiement)
# Nom du projet : ma-maison (ou mamaison-niger)
```

### 3. Configurer les variables d'environnement
```powershell
# IMPORTANT : remplacer les valeurs par les vraies (depuis .env.local)
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Entrer : https://wvxojyoblzlvbedtorwq.supabase.co

npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Entrer la clé anon

npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Entrer la clé service role (CONFIDENTIELLE)

npx vercel env add DATABASE_URL production
# Entrer l'URL PostgreSQL complète

npx vercel env add DIRECT_URL production
# Même URL PostgreSQL (sans pgbouncer=true pour migrations)

npx vercel env add NEXT_PUBLIC_APP_URL production
# Entrer : https://VOTRE_DOMAINE.vercel.app (après le premier deploy)
```

### 4. Premier déploiement en production
```powershell
npx vercel --prod
```

### 5. Après le premier déploiement
1. Copier l'URL générée (ex: `https://ma-maison-xyz.vercel.app`)
2. Mettre à jour `NEXT_PUBLIC_APP_URL` dans Vercel avec cette URL
3. Aller dans Supabase Dashboard → Authentication → URL Configuration
4. Ajouter l'URL dans "Site URL" et "Redirect URLs"
5. Re-déployer : `npx vercel --prod`

### Redéploiements futurs
```powershell
# Simple push Git = redéploiement automatique si connecté à GitHub
git push origin main
```
