import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Toaster } from '@/components/ui/sonner'
import Layout from '@/components/Layout'
import ResourcePage from '@/components/ResourcePage'
import AccessDenied from '@/pages/AccessDenied'
import Login from '@/pages/Login'
import { resources } from '@/pages/resources'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [adminCheck, setAdminCheck] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    supabase.rpc('is_admin').then(({ data }) => setAdminCheck({ userId, value: data === true }))
  }, [userId])
  const isAdmin = adminCheck && adminCheck.userId === userId ? adminCheck.value : undefined

  let content
  if (session === undefined) content = null
  else if (!session) content = <Login />
  else if (isAdmin === undefined) content = null
  else if (!isAdmin) content = <AccessDenied email={session.user.email} />
  else
    content = (
      <BrowserRouter>
        <Routes>
          <Route element={<Layout email={session.user.email} />}>
            {resources.map((r) => (
              <Route key={r.path} path={r.path} element={<ResourcePage key={r.path} resource={r} />} />
            ))}
            <Route path="*" element={<Navigate to={resources[0].path} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )

  return (
    <>
      {content}
      <Toaster position="bottom-right" />
    </>
  )
}
