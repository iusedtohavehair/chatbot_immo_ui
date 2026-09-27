# Admin – Chatbot immo

Interface d'administration pour gérer les propriétaires, immeubles, logements et locataires.
React (Vite) + Tailwind/shadcn + Supabase.

## Installation

```bash
npm install
npm run dev
```

Le fichier `.env` doit contenir :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Utiliser la clé **publishable** (Settings > API Keys). Ne jamais mettre la clé secrète (`sb_secret_...`) ici : elle serait visible dans le navigateur.

## Supabase (une seule fois)

Dans Supabase > SQL Editor, exécuter dans l'ordre :

1. `supabase/schema.sql` : crée les tables (si elles n'existent pas).
2. `supabase/policies.sql` : active la sécurité (seuls les utilisateurs connectés ont accès).
3. `supabase/migration_fk.sql` : optionnel, ajoute les clés étrangères.

## Créer un compte admin

Supabase > Authentication > Users > **Add user** (courriel + mot de passe, cocher "Auto confirm").
Il n'y a pas d'inscription publique.

## Ajouter un champ ou une table

Tout est dans `src/pages/resources.js`. Ajouter un champ = ajouter une ligne :

```js
{ key: 'phone', label: 'Téléphone', type: 'tel' }
{ key: 'building', label: 'Immeuble', ref: 'buildings' } // liste déroulante vers une autre table
```

## Structure

```
src/
  lib/supabase.js            client Supabase
  pages/resources.js         configuration des tables
  pages/Login.jsx            connexion
  components/Layout.jsx      barre latérale
  components/ResourcePage.jsx  page générique (tableau + formulaire)
  components/ui/             composants shadcn
supabase/                    scripts SQL
```
