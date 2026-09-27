import { Briefcase, Building2, DoorOpen, Users } from 'lucide-react'

// Chaque entrée décrit une table Supabase et génère automatiquement sa page.
// Champ: { key, label, type?: 'text' | 'email' | 'tel' | 'boolean', ref?: <table liée> }
// `filter` = clé d'un champ `ref` proposé comme filtre en haut de la page.
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
]
