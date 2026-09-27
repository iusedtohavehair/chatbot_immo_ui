import { Briefcase, Building2, DoorOpen, UserCog, Users } from 'lucide-react'
import { createUser } from '@/lib/users'

// Chaque entrée décrit une table Supabase et génère automatiquement sa page.
// Champ: {
//   key, label,
//   type?: 'text' | 'email' | 'tel' | 'password' | 'boolean',
//   ref?: <table liée>            -> liste déroulante vers une autre table
//   options?: [{ value, label }]  -> liste déroulante à choix fixes
//   default?, required?,
//   createOnly?                   -> seulement à la création, jamais affiché ni modifié ensuite
//   lockOnEdit?                   -> non modifiable après la création
// }
// `filter` = clé d'un champ `ref` proposé comme filtre en haut de la page.
// `create` = fonction de création personnalisée (sinon insert direct dans la table).
// `children` = liens vers une table de jointure, gérés dans le formulaire (voir ChildList).
export const resources = [
  {
    path: 'proprietaires',
    table: 'landlord',
    label: 'Propriétaires',
    singular: 'propriétaire',
    icon: Briefcase,
    fields: [
      { key: 'name', label: 'Nom' },
      { key: 'active', label: 'Actif', type: 'boolean' },
    ],
  },
  {
    path: 'immeubles',
    table: 'buildings',
    label: 'Immeubles',
    singular: 'immeuble',
    icon: Building2,
    filter: 'landlord',
    fields: [
      { key: 'name', label: 'Nom' },
      { key: 'address', label: 'Adresse' },
      { key: 'city', label: 'Ville' },
      { key: 'zip', label: 'Code postal' },
      { key: 'landlord', label: 'Propriétaire', ref: 'landlord' },
      { key: 'active', label: 'Actif', type: 'boolean' },
    ],
  },
  {
    path: 'logements',
    table: 'doors',
    label: 'Logements',
    singular: 'logement',
    icon: DoorOpen,
    filter: 'building',
    fields: [
      { key: 'name', label: 'Porte' },
      { key: 'building', label: 'Immeuble', ref: 'buildings' },
      { key: 'tenants', label: 'Locataire', ref: 'tenants' },
      { key: 'active', label: 'Actif', type: 'boolean' },
    ],
  },
  {
    path: 'locataires',
    table: 'tenants',
    label: 'Locataires',
    singular: 'locataire',
    icon: Users,
    fields: [
      { key: 'name', label: 'Nom' },
      { key: 'phone', label: 'Téléphone', type: 'tel' },
      { key: 'email', label: 'Courriel', type: 'email' },
      { key: 'active', label: 'Actif', type: 'boolean' },
    ],
  },
  {
    path: 'utilisateurs',
    table: 'users',
    label: 'Utilisateurs',
    singular: 'utilisateur',
    icon: UserCog,
    create: createUser,
    children: {
      table: 'user_buildings',
      foreignKey: 'user_id',
      label: 'Immeubles',
      fields: [
        { key: 'building', label: 'Immeuble', ref: 'buildings' },
        {
          key: 'role',
          label: 'Rôle',
          default: 'concierge',
          options: [
            { value: 'concierge', label: 'Concierge' },
            { value: 'gestionnaire', label: 'Gestionnaire' },
            { value: 'proprietaire', label: 'Propriétaire' },
            { value: 'technicien', label: 'Technicien' },
          ],
        },
      ],
    },
    fields: [
      { key: 'name', label: 'Nom' },
      { key: 'email', label: 'Courriel', type: 'email', required: true, lockOnEdit: true },
      { key: 'password', label: 'Mot de passe', type: 'password', required: true, createOnly: true },
      {
        key: 'role',
        label: 'Rôle',
        default: 'concierge',
        options: [
          { value: 'concierge', label: 'Concierge' },
          { value: 'admin', label: 'Admin' },
        ],
      },
      { key: 'active', label: 'Actif', type: 'boolean' },
    ],
  },
]
