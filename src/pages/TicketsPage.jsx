import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { myScope } from '@/lib/scope'
import { CATEGORIES, PRIORITIES, RESOLVED, STATES, findOption } from '@/lib/tickets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const ALL = '__all__'
const OPEN = '__open__'
const NONE = '__none__'

const byId = (list) => Object.fromEntries(list.map((x) => [String(x.id), x]))

export default function TicketsPage() {
  const [data, setData] = useState({ tickets: [], doors: [], buildings: [], tenants: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [buildingFilter, setBuildingFilter] = useState(ALL)
  const [stateFilter, setStateFilter] = useState(OPEN)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    let scope
    try {
      scope = await myScope(['buildings', 'doors', 'tenants'])
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    const [tickets, doors, buildings, tenants] = await Promise.all([
      supabase
        .from('tickets')
        .select('*')
        .eq('is_deleted', false)
        .in('door', scope.doors)
        .order('created_at', { ascending: false }),
      supabase.from('doors').select('id, name, building, tenants').in('id', scope.doors).order('name'),
      supabase.from('buildings').select('id, name').in('id', scope.buildings).order('name'),
      supabase.from('tenants').select('id, name, phone').in('id', scope.tenants).order('name'),
    ])
    const error = tickets.error || doors.error || buildings.error || tenants.error
    if (error) toast.error(error.message)
    setData({
      tickets: tickets.data ?? [],
      doors: doors.data ?? [],
      buildings: buildings.data ?? [],
      tenants: tenants.data ?? [],
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const maps = useMemo(
    () => ({ doors: byId(data.doors), buildings: byId(data.buildings), tenants: byId(data.tenants) }),
    [data],
  )

  const rows = useMemo(
    () =>
      data.tickets.map((t) => {
        const door = maps.doors[String(t.door)]
        return {
          ticket: t,
          door,
          building: door ? maps.buildings[String(door.building)] : undefined,
          tenant: maps.tenants[String(t.tenant)],
        }
      }),
    [data.tickets, maps],
  )

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(({ ticket, door, building, tenant }) => {
      if (buildingFilter !== ALL && String(door?.building) !== buildingFilter) return false
      if (stateFilter === OPEN && Number(ticket.state) === RESOLVED) return false
      if (stateFilter !== OPEN && stateFilter !== ALL && String(ticket.state) !== stateFilter) return false
      if (!q) return true
      return [`#${ticket.id}`, ticket.title, ticket.summary, ticket.text, ticket.category, door?.name, building?.name, tenant?.name]
        .some((v) => v && String(v).toLowerCase().includes(q))
    })
  }, [rows, search, buildingFilter, stateFilter])

  function openNew() {
    setEditing({
      priority: 2,
      state: 0,
      building: buildingFilter !== ALL ? buildingFilter : '',
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <Button onClick={openNew} disabled={data.doors.length === 0}>
          <Plus /> Nouveau ticket
        </Button>
      </div>

      {!loading && data.buildings.length === 0 && (
        <p className="mb-4 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Aucun immeuble ne vous est associé. Contactez l'administrateur.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={buildingFilter} onValueChange={setBuildingFilter}>
          <SelectTrigger className="min-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les immeubles</SelectItem>
            {data.buildings.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name || `#${b.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OPEN}>Non résolus</SelectItem>
            <SelectItem value={ALL}>Tous les états</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s.value} value={String(s.value)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">#</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Immeuble</TableHead>
              <TableHead>Porte</TableHead>
              <TableHead>Locataire</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Créé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map(({ ticket, door, building, tenant }) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => setEditing({ ...ticket, building: door ? String(door.building) : '' })}
              >
                <TableCell className="text-muted-foreground">{ticket.id}</TableCell>
                <TableCell className="max-w-72 truncate font-medium">{ticket.title || ticket.summary || '—'}</TableCell>
                <TableCell>{building?.name ?? '—'}</TableCell>
                <TableCell>{door?.name ?? '—'}</TableCell>
                <TableCell>{tenant?.name ?? '—'}</TableCell>
                <TableCell>
                  <OptionBadge option={findOption(PRIORITIES, ticket.priority)} />
                </TableCell>
                <TableCell>
                  <OptionBadge option={findOption(STATES, ticket.state)} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleDateString('fr-CA')}
                </TableCell>
              </TableRow>
            ))}
            {!loading && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Aucun ticket
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <TicketDialog
          key={editing.id ?? 'new'}
          ticket={editing}
          data={data}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function OptionBadge({ option }) {
  if (!option) return <span className="text-muted-foreground">—</span>
  return <Badge className={cn('border-transparent', option.className)}>{option.label}</Badge>
}

function TicketDialog({ ticket, data, onClose, onSaved }) {
  const isNew = !ticket.id
  const [form, setForm] = useState(() => ({
    building: ticket.building ?? '',
    door: ticket.door != null ? String(ticket.door) : '',
    title: ticket.title ?? '',
    summary: ticket.summary ?? '',
    text: ticket.text ?? '',
    category: ticket.category ?? '',
    priority: String(ticket.priority ?? 2),
    state: String(ticket.state ?? 0),
  }))
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const doorOptions = data.doors.filter((d) => !form.building || String(d.building) === form.building)

  // Le locataire est toujours celui du logement. Un ticket existant garde son locataire
  // d'origine tant que le logement ne change pas (historique si le locataire déménage).
  const selectedDoor = data.doors.find((d) => String(d.id) === form.door)
  const doorChanged = isNew || form.door !== String(ticket.door ?? '')
  const tenantId = doorChanged ? selectedDoor?.tenants : ticket.tenant
  const tenant = data.tenants.find((t) => String(t.id) === String(tenantId))

  function selectBuilding(building) {
    setForm((f) => {
      const door = data.doors.find((d) => String(d.id) === f.door)
      return { ...f, building, door: door && String(door.building) === building ? f.door : '' }
    })
  }

  function selectDoor(doorId) {
    const door = data.doors.find((d) => String(d.id) === doorId)
    setForm((f) => ({
      ...f,
      door: doorId,
      building: door ? String(door.building) : f.building,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.door) return toast.error('Choisir un logement')
    setSaving(true)
    const payload = {
      door: form.door,
      ...(doorChanged && { tenant: tenantId ? Number(tenantId) : null }),
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      text: form.text.trim() || null,
      category: form.category || null,
      priority: Number(form.priority),
      state: Number(form.state),
    }
    const { error } = isNew
      ? await supabase.from('tickets').insert(payload)
      : await supabase.from('tickets').update(payload).eq('id', ticket.id)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success(isNew ? 'Ticket créé' : 'Ticket mis à jour')
    onSaved()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nouveau ticket' : `Ticket #${ticket.id}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              required
              autoFocus={isNew}
              placeholder="Ex. : Fuite sous l'évier"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Immeuble"
              value={form.building}
              onChange={selectBuilding}
              options={data.buildings.map((b) => ({ value: String(b.id), label: b.name || `#${b.id}` }))}
            />
            <SelectField
              label="Porte"
              value={form.door}
              onChange={selectDoor}
              options={doorOptions.map((d) => ({ value: String(d.id), label: d.name || `#${d.id}` }))}
            />
            <div className="grid gap-2">
              <Label>Locataire</Label>
              <div className="flex h-8 items-center truncate rounded-lg border bg-muted/50 px-2.5 text-sm text-muted-foreground">
                {tenant?.name ?? (form.door ? 'Aucun locataire' : 'Selon la porte')}
              </div>
            </div>
            <SelectField
              label="Catégorie"
              value={form.category}
              onChange={(v) => set('category', v)}
              allowNone
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <SelectField
              label="Priorité"
              value={form.priority}
              onChange={(v) => set('priority', v)}
              options={PRIORITIES.map((p) => ({ value: String(p.value), label: p.label }))}
            />
            <SelectField
              label="État"
              value={form.state}
              onChange={(v) => set('state', v)}
              options={STATES.map((s) => ({ value: String(s.value), label: s.label }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Sommaire</Label>
            <Textarea
              id="summary"
              rows={2}
              placeholder="Résumé en quelques mots"
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="text">Description</Label>
            <Textarea
              id="text"
              rows={4}
              placeholder="Détails du problème"
              value={form.text}
              onChange={(e) => set('text', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SelectField({ label, value, onChange, options, allowNone }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value || (allowNone ? NONE : '')} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choisir..." />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value={NONE}>Aucun</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
