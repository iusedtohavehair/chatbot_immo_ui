import { useCallback, useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Liste de liens (table de jointure) affichée dans le formulaire d'un enregistrement.
// config: { table, foreignKey, label, fields: [champ `ref` ou `options`, ...] }
export default function ChildList({ config, parentId }) {
  const [rows, setRows] = useState([])
  const [refs, setRefs] = useState({})
  const [draft, setDraft] = useState(() => blankDraft(config))

  const load = useCallback(async () => {
    const refFields = config.fields.filter((f) => f.ref)
    const [main, ...refResults] = await Promise.all([
      supabase.from(config.table).select('*').eq(config.foreignKey, parentId).order('created_at'),
      ...refFields.map((f) => supabase.from(f.ref).select('id, name').order('name')),
    ])
    if (main.error) toast.error(main.error.message)
    setRows(main.data ?? [])
    setRefs(Object.fromEntries(refFields.map((f, i) => [f.ref, refResults[i].data ?? []])))
  }, [config, parentId])

  useEffect(() => {
    load()
  }, [load])

  const optionsFor = (f) =>
    f.ref ? (refs[f.ref] ?? []).map((r) => ({ value: String(r.id), label: r.name || `#${r.id}` })) : f.options

  const labelFor = (f, value) => optionsFor(f).find((o) => o.value === String(value))?.label ?? value

  async function add() {
    if (config.fields.some((f) => !draft[f.key])) return toast.error('Remplir tous les champs')
    const { error } = await supabase.from(config.table).insert({ ...draft, [config.foreignKey]: parentId })
    if (error) return toast.error(error.code === '23505' ? 'Déjà associé' : error.message)
    setDraft(blankDraft(config))
    load()
  }

  async function remove(id) {
    const { error } = await supabase.from(config.table).delete().eq('id', id)
    if (error) return toast.error(error.message)
    load()
  }

  return (
    <div className="grid gap-2 border-t pt-4">
      <Label>{config.label}</Label>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucun</p>}
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            {config.fields.map((f, i) =>
              i === 0 ? (
                <span key={f.key} className="truncate">
                  {labelFor(f, row[f.key])}
                </span>
              ) : (
                <Badge key={f.key} variant="secondary">
                  {labelFor(f, row[f.key])}
                </Badge>
              ),
            )}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(row.id)}>
            <X />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        {config.fields.map((f) => (
          <Select key={f.key} value={draft[f.key]} onValueChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}>
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {optionsFor(f).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus />
        </Button>
      </div>
    </div>
  )
}

function blankDraft(config) {
  return Object.fromEntries(config.fields.map((f) => [f.key, f.default ?? '']))
}
