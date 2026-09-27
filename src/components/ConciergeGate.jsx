import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import AccessDenied from '@/pages/AccessDenied'
import { conciergeNav } from '@/pages/concierge'

export default function ConciergeGate({ session }) {
  const [check, setCheck] = useState(null)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    supabase
      .from('users')
      .select('active')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setCheck({ userId, active: data?.active === true }))
  }, [userId])

  if (!session) return <Navigate to="/login" replace />
  if (!check || check.userId !== userId) return null
  if (!check.active) return <AccessDenied message={`Le compte ${session.user.email} est inactif ou n'a pas accès.`} />
  return <Layout title="Concierge" items={conciergeNav} email={session.user.email} />
}
