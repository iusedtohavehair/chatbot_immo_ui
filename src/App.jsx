import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Toaster } from '@/components/ui/sonner'
import Layout from '@/components/Layout'
import ResourcePage from '@/components/ResourcePage'
import Login from '@/pages/Login'
import { resources } from '@/pages/resources'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <>
      {session ? (
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
      ) : (
        <Login />
      )}
      <Toaster position="bottom-right" />
    </>
  )
}
