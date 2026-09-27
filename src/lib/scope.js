import { supabase } from '@/lib/supabase'

// Ids accessibles à l'utilisateur connecté selon ses immeubles (fonctions SQL de concierge.sql).
// Filtre explicite côté interface : un admin a accès à tout via RLS, mais sur la plateforme
// concierge il ne doit voir que ses immeubles comme tout le monde.
const FUNCTIONS = {
  buildings: 'my_building_ids',
  doors: 'my_door_ids',
  tenants: 'my_tenant_ids',
  landlord: 'my_landlord_ids',
}

export async function myIds(table) {
  const { data, error } = await supabase.rpc(FUNCTIONS[table])
  if (error) throw error
  return (data ?? []).map((x) => (x !== null && typeof x === 'object' ? Object.values(x)[0] : x)).filter((x) => x != null)
}

export async function myScope(tables) {
  const ids = await Promise.all(tables.map(myIds))
  return Object.fromEntries(tables.map((t, i) => [t, ids[i]]))
}
