// Valeurs stockées dans tickets.priority et tickets.state (colonnes numeric).
export const PRIORITIES = [
  { value: 1, label: 'Urgent', className: 'bg-red-100 text-red-700' },
  { value: 2, label: 'Élevé', className: 'bg-amber-100 text-amber-800' },
  { value: 3, label: 'Normal', className: 'bg-blue-100 text-blue-700' },
  { value: 4, label: 'Basse', className: 'bg-slate-100 text-slate-700' },
]

export const DEFAULT_PRIORITY = 3

export const STATES = [
  { value: 0, label: 'Nouveau', className: 'bg-blue-100 text-blue-700' },
  { value: 1, label: 'En cours', className: 'bg-amber-100 text-amber-800' },
  { value: 2, label: 'En attente', className: 'bg-slate-100 text-slate-700' },
  { value: 3, label: 'Résolu', className: 'bg-green-100 text-green-700' },
]

export const RESOLVED = 3

export const CATEGORIES = [
  'Plomberie',
  'Électricité',
  'Chauffage / climatisation',
  'Électroménagers',
  'Serrurerie',
  'Parasites',
  'Bruit',
  'Autre',
]

export const findOption = (list, value) => list.find((o) => o.value === Number(value))
