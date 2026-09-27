import { Building2, DoorOpen, Ticket } from 'lucide-react'

// Pages de consultation de la plateforme concierge (même format que resources.js).
// Les données sont automatiquement limitées aux immeubles de l'utilisateur (RLS, voir supabase/concierge.sql).
export const conciergeResources = [
  {
    path: 'immeubles',
    table: 'buildings',
    label: 'Mes immeubles',
    icon: Building2,
    readOnly: true,
    filter: 'landlord',
    fields: [
      { key: 'name', label: 'Nom' },
      { key: 'address', label: 'Adresse' },
      { key: 'city', label: 'Ville' },
      { key: 'zip', label: 'Code postal' },
      { key: 'landlord', label: 'Propriétaire', ref: 'landlord' },
    ],
  },
  {
    path: 'logements',
    table: 'doors',
    label: 'Mes logements',
    icon: DoorOpen,
    readOnly: true,
    filter: 'building',
    fields: [
      { key: 'name', label: 'Porte' },
      { key: 'building', label: 'Immeuble', ref: 'buildings' },
      { key: 'tenants', label: 'Locataire', ref: 'tenants' },
    ],
  },
]

export const conciergeNav = [
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  ...conciergeResources.map((r) => ({ to: `/${r.path}`, label: r.label, icon: r.icon })),
]
