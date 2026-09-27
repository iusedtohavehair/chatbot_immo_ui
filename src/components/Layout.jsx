import { NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { resources } from '@/pages/resources'

export default function Layout({ email }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b bg-muted/40 p-3 md:w-60 md:border-r md:border-b-0">
        <div className="px-3 py-2 text-lg font-semibold">Admin</div>

        <nav className="mt-2 flex gap-1 overflow-x-auto md:flex-col">
          {resources.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={`/${path}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-accent',
                  isActive && 'bg-background font-medium shadow-sm ring-1 ring-border',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-2 border-t pt-3 md:mt-auto">
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{email}</p>
          <Button variant="ghost" className="w-full justify-start" onClick={() => supabase.auth.signOut()}>
            <LogOut /> Déconnexion
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
