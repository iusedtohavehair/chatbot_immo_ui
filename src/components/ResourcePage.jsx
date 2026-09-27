import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { myScope } from '@/lib/scope'
import ChildList from '@/components/ChildList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Radix Select n'accepte pas '' comme valeur d'option.
const NONE = '__none__'
const ALL = '__all__'

export default function ResourcePage({ resource }) {
  const { label, singular, fields, filter, readOnly } = resource
  const tableFields = fields.filter((f) => !f.createOnly)

  const [rows, setRows] = useState([])
  const [refs, setRefs] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState(ALL)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    const refFields = resource.fields.filter((f) => f.ref)
    let scope = null
    if (resource.scoped) {
      try {
        scope = await myScope([...new Set([resource.table, ...refFields.map((f) => f.ref)])])
      } catch (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
    }
    const inScope = (query, table) => (scope ? query.in('id', scope[table]) : query)
    const [main, ...refResults] = await Promise.all([
      inScope(supabase.from(resource.table).select('*'), resource.table).order('created_at', { ascending: false }),
      ...refFields.map((f) => inScope(supabase.from(f.ref).select('id, name, active'), f.ref).order('name')),
    ])
    if (main.error) toast.error(main.error.message)
    setRows(main.data ?? [])
    setRefs(Object.fromEntries(refFields.map((f, i) => [f.ref, refResults[i].data ?? []])))
    setLoading(false)
  }, [resource])

  useEffect(() => {
    load()
  }, [load])

  const displayValue = useCallback(
    (field, row) => {
      const value = row[field.key]
      if (value == null || value === '') return ''
      if (field.ref) {
        const item = refs[field.ref]?.find((r) => String(r.id) === String(value))
        return item?.name ?? `#${value}`
      }
      if (field.options) return field.options.find((o) => o.value === value)?.label ?? value
      return value
    },
    [refs],
  )

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter && filterValue !== ALL && String(row[filter]) !== filterValue) return false
      if (!q) return true
      return fields.some((f) => f.type !== 'boolean' && String(displayValue(f, row)).toLowerCase().includes(q))
    })
  }, [rows, search, filter, filterValue, fields, displayValue])

  const filterField = fields.find((f) => f.key === filter)

  function openNew() {
    const blank = Object.fromEntries(fields.map((f) => [f.key, f.default ?? (f.type === 'boolean' ? true : '')]))
    if (filter && filterValue !== ALL) blank[filter] = filterValue
    setEditing(blank)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        {!readOnly && (
          <Button onClick={openNew}>
            <Plus /> Ajouter
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {filterField && (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="min-w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filterField.label} : tous</SelectItem>
              {(refs[filterField.ref] ?? []).map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name || `#${r.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              {tableFields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={readOnly ? undefined : () => setEditing(row)}
                className={cn(!readOnly && 'cursor-pointer', row.active === false && 'text-muted-foreground')}
              >
                {tableFields.map((f) => (
                  <TableCell key={f.key}>
                    {f.type === 'boolean' ? (
                      <Badge variant={row[f.key] ? 'secondary' : 'outline'}>{row[f.key] ? 'Oui' : 'Non'}</Badge>
                    ) : (
                      displayValue(f, row) || <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!loading && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableFields.length} className="py-10 text-center text-muted-foreground">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <EditDialog
          key={editing.id ?? 'new'}
          record={editing}
          resource={resource}
          refs={refs}
          onClose={() => setEditing(null)}
          onSaved={(created) => {
            // Après création, on reste dans le formulaire si des liens (children) restent à ajouter.
            setEditing(created && resource.children ? created : null)
            load()
          }}
          title={editing.id ? `Modifier : ${editing.name || singular}` : `Ajouter un ${singular}`}
        />
      )}
    </div>
  )
}

function EditDialog({ record, resource, refs, onClose, onSaved, title }) {
  const [form, setForm] = useState(record)
  const [saving, setSaving] = useState(false)
  const isNew = !record.id
  const formFields = resource.fields.filter((f) => isNew || !f.createOnly)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = Object.fromEntries(
      formFields
        .filter((f) => isNew || !f.lockOnEdit)
        .map((f) => {
          const v = form[f.key]
          if (f.type === 'boolean') return [f.key, !!v]
          if (v === '' || v == null) return [f.key, null]
          return [f.key, f.type === 'password' ? String(v) : String(v).trim()]
        }),
    )
    let data, error
    if (!isNew) ({ error } = await supabase.from(resource.table).update(payload).eq('id', record.id))
    else if (resource.create) ({ data, error } = await resource.create(payload))
    else ({ data, error } = await supabase.from(resource.table).insert(payload).select().single())
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Enregistré')
    onSaved(data)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {formFields.map((f) => (
            <Field
              key={f.key}
              field={f}
              value={form[f.key]}
              refOptions={refs[f.ref]}
              disabled={!isNew && f.lockOnEdit}
              onChange={(v) => set(f.key, v)}
            />
          ))}
          {resource.children &&
            (isNew ? (
              <p className="border-t pt-4 text-sm text-muted-foreground">
                {resource.children.label} : à ajouter après l'enregistrement.
              </p>
            ) : (
              <ChildList config={resource.children} parentId={record.id} />
            ))}
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

function Field({ field, value, refOptions, disabled, onChange }) {
  const id = `field-${field.key}`

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{field.label}</Label>
        <Switch id={id} checked={!!value} onCheckedChange={onChange} disabled={disabled} />
      </div>
    )
  }

  if (field.ref || field.options) {
    const items = field.ref
      ? [
          { value: NONE, label: 'Aucun' },
          ...(refOptions ?? []).map((o) => ({
            value: String(o.id),
            label: `${o.name || `#${o.id}`}${o.active === false ? ' (inactif)' : ''}`,
          })),
        ]
      : field.options
    const current = value == null || value === '' ? (field.ref ? NONE : '') : String(value)

    return (
      <div className="grid gap-2">
        <Label>{field.label}</Label>
        <Select value={current} onValueChange={(v) => onChange(v === NONE ? '' : v)} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
          <SelectContent>
            {items.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.label}</Label>
      <Input
        id={id}
        type={field.type ?? 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        minLength={field.type === 'password' ? 6 : undefined}
        disabled={disabled}
      />
    </div>
  )
}
