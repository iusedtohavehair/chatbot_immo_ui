import { supabase } from '@/lib/supabase'

// Création d'un compte de connexion : passe par l'Edge Function `create-user`
// car elle nécessite la clé secrète (voir supabase/functions/create-user).
export async function createUser(payload) {
  const { error } = await supabase.functions.invoke('create-user', { body: payload })
  if (!error) return { error: null }
  const body = await error.context?.json?.().catch(() => null)
  return { error: { message: body?.error ?? error.message } }
}
