// Crée un compte Supabase Auth + sa ligne dans public.users.
// Réservé aux admins. Nécessite la clé secrète, donc ne peut pas être fait depuis le navigateur.
// Déploiement : désactiver "Enforce JWT verification" (l'autorisation est vérifiée ici via is_admin).
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const publishableKey = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)['default']
  const secretKey = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']

  const caller = createClient(url, publishableKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: isAdmin } = await caller.rpc('is_admin')
  if (!isAdmin) return json({ error: 'Accès refusé' }, 403)

  const { email, password, name, role, active } = await req.json()
  if (!email || !password) return json({ error: 'Courriel et mot de passe requis' }, 400)

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) return json({ error: error.message }, 400)

  const { error: insertError } = await admin.from('users').insert({
    id: data.user.id,
    email,
    name: name ?? null,
    role: role ?? 'concierge',
    active: active ?? true,
  })
  if (insertError) {
    await admin.auth.admin.deleteUser(data.user.id)
    return json({ error: insertError.message }, 400)
  }

  return json({ id: data.user.id })
})
