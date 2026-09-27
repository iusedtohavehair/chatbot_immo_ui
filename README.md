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

1. Créer le premier compte admin : Authentication > Users > **Add user** (courriel + mot de passe, cocher "Auto confirm").
2. `supabase/schema.sql` : crée les tables (si elles n'existent pas).
3. `supabase/users.sql` : table des utilisateurs + rôles. Les comptes Auth existants deviennent admins.
4. `supabase/policies.sql` : active la sécurité (seuls les admins ont accès aux données).
5. `supabase/user_buildings.sql` : lie un utilisateur à plusieurs immeubles avec un rôle par immeuble,
   et permet à chacun de lire les immeubles, logements et tickets de ses immeubles.
6. `supabase/migration_fk.sql` : optionnel, ajoute les clés étrangères.

Puis déployer l'Edge Function qui crée les comptes (page Utilisateurs) :

- Edge Functions > **Deploy a new function** > Via Editor.
- Nom : `create-user`. Coller le contenu de `supabase/functions/create-user/index.ts`.
- Désactiver **Enforce JWT verification** (la fonction vérifie elle-même que l'appelant est admin).

## Utilisateurs

Page **Utilisateurs** : admins et concierges. Les nouveaux comptes sont créés depuis l'interface
(il n'y a pas d'inscription publique). Seuls les comptes avec le rôle `admin` peuvent ouvrir cette interface.
Dans le formulaire d'un utilisateur, section **Immeubles** : associer autant d'immeubles que voulu,
chacun avec un rôle (concierge, gestionnaire, propriétaire, technicien).
Désactiver un admin (switch "Actif") lui retire l'accès à cette interface. Pour les concierges,
la future plateforme de tickets devra aussi vérifier `active`.

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
  lib/users.js               création d'utilisateur (appelle l'Edge Function)
  pages/resources.js         configuration des tables
  pages/Login.jsx            connexion
  pages/AccessDenied.jsx     compte connecté mais non admin
  components/Layout.jsx      barre latérale
  components/ResourcePage.jsx  page générique (tableau + formulaire)
  components/ui/             composants shadcn
supabase/                    scripts SQL
supabase/functions/create-user/  Edge Function (création des comptes)
```
