import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import AccessDenied from '@/pages/AccessDenied'
import { resources } from '@/pages/resources'

const items = resources.map((r) => ({ to: `/admin/${r.path}`, label: r.label, icon: r.icon }))

export default function AdminGate({ session }) {
  const [check, setCheck] = useState(null)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    supabase.rpc('is_admin').then(({ data }) => setCheck({ userId, isAdmin: data === true }))
  }, [userId])

  if (!session) return <Navigate to="/admin/login" replace />
  if (!check || check.userId !== userId) return null
  if (!check.isAdmin) return <AccessDenied message={`Le compte ${session.user.email} n'est pas administrateur.`} />
  return <Layout title="Admin" items={items} email={session.user.email} />
}
