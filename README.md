# Chatbot immo – Plateforme de tickets

Deux espaces dans la même application :

| URL | Pour qui | Contenu |
| --- | --- | --- |
| `/admin` (login : `/admin/login`) | Nous (admins) | Propriétaires, immeubles, logements, locataires, utilisateurs |
| `/` (login : `/login`) | Concierges | Tickets, immeubles et logements de leurs immeubles |

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
5. `supabase/user_buildings.sql` : lie un utilisateur à plusieurs immeubles avec un rôle par immeuble.
6. `supabase/concierge.sql` : colonne `tenant` sur les tickets + droits des concierges
   (lire/créer/modifier les tickets de leurs logements, lire leurs immeubles, logements, locataires, propriétaires).
7. `supabase/migration_fk.sql` : optionnel, ajoute les clés étrangères.

Puis déployer l'Edge Function qui crée les comptes (page Utilisateurs) :

- Edge Functions > **Deploy a new function** > Via Editor.
- Nom : `create-user`. Coller le contenu de `supabase/functions/create-user/index.ts`.
- Désactiver **Enforce JWT verification** (la fonction vérifie elle-même que l'appelant est admin).

## Utilisateurs

Page **Utilisateurs** (admin) : admins et concierges. Les comptes sont créés depuis l'interface
(il n'y a pas d'inscription publique).

- Rôle `admin` : accès à `/admin`.
- Section **Immeubles** du formulaire : associer autant d'immeubles que voulu, chacun avec un rôle
  (concierge, gestionnaire, propriétaire, technicien). C'est ce qui détermine ce que la personne voit sur `/`.
- Switch **Actif** : un compte inactif perd l'accès aux deux espaces.

## Tickets

- Priorité (`priority`) : 1 Basse, 2 Normale, 3 Haute, 4 Urgente.
- État (`state`) : 0 Nouveau, 1 En cours, 2 En attente, 3 Résolu.
- `owner` = id de l'utilisateur qui a créé le ticket (rempli automatiquement). `tenant` = locataire concerné.
- Valeurs et catégories : `src/lib/tickets.js`.

## Ajouter un champ ou une table

Pages admin : `src/pages/resources.js`. Pages de consultation concierge : `src/pages/concierge.js`.
Ajouter un champ = ajouter une ligne :

```js
{ key: 'phone', label: 'Téléphone', type: 'tel' }
{ key: 'building', label: 'Immeuble', ref: 'buildings' } // liste déroulante vers une autre table
```

## Structure

```
src/
  App.jsx                    routes des deux espaces
  lib/supabase.js            client Supabase
  lib/auth.js                session courante
  lib/users.js               création d'utilisateur (appelle l'Edge Function)
  lib/tickets.js             priorités, états, catégories
  pages/resources.js         configuration des pages admin
  pages/concierge.js         configuration des pages concierge
  pages/TicketsPage.jsx      tickets (concierge)
  pages/Login.jsx            connexion
  pages/AccessDenied.jsx     compte connecté sans accès
  components/AdminGate.jsx   protège /admin
  components/ConciergeGate.jsx  protège /
  components/Layout.jsx      barre latérale
  components/ResourcePage.jsx  page générique (tableau + formulaire)
  components/ChildList.jsx   liens dans un formulaire (ex. immeubles d'un utilisateur)
  components/ui/             composants shadcn
supabase/                    scripts SQL
supabase/functions/create-user/  Edge Function (création des comptes)
```
