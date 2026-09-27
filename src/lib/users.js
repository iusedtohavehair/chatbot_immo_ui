import { supabase } from '@/lib/supabase'

// Création d'un compte de connexion : passe par l'Edge Function `create-user`
// car elle nécessite la clé secrète (voir supabase/functions/create-user).
export async function createUser(payload) {
  const { data, error } = await supabase.functions.invoke('create-user', { body: payload })
  if (error) {
    const body = await error.context?.json?.().catch(() => null)
    return { data: null, error: { message: body?.error ?? error.message } }
  }
  const { password: _password, ...user } = payload
  return { data: { ...user, id: data.id }, error: null }
}
