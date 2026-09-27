import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'
import AdminGate from '@/components/AdminGate'
import ConciergeGate from '@/components/ConciergeGate'
import ResourcePage from '@/components/ResourcePage'
import Login from '@/pages/Login'
import TicketsPage from '@/pages/TicketsPage'
import { conciergeResources } from '@/pages/concierge'
import { resources } from '@/pages/resources'

export default function App() {
  const session = useSession()
  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        {/* Administration */}
        <Route
          path="/admin/login"
          element={session ? <Navigate to="/admin" replace /> : <Login title="Administration" />}
        />
        <Route path="/admin" element={<AdminGate session={session} />}>
          <Route index element={<Navigate to={resources[0].path} replace />} />
          {resources.map((r) => (
            <Route key={r.path} path={r.path} element={<ResourcePage key={r.path} resource={r} />} />
          ))}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Concierges */}
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login title="Espace concierge" />} />
        <Route path="/" element={<ConciergeGate session={session} />}>
          <Route index element={<Navigate to="tickets" replace />} />
          <Route path="tickets" element={<TicketsPage />} />
          {conciergeResources.map((r) => (
            <Route key={r.path} path={r.path} element={<ResourcePage key={r.path} resource={r} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}
