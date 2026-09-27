import { useCallback, useEffect, useState } from 'react'
import { Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const formatDate = (value) =>
  new Date(value).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })

export default function TicketComments({ ticketId }) {
  const session = useSession()
  const userId = session?.user.id
  const [comments, setComments] = useState([])
  const [authors, setAuthors] = useState({})
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const [list, users] = await Promise.all([
      supabase
        .from('comments')
        .select('*')
        .eq('ticket', String(ticketId))
        .eq('is_deleted', false)
        .order('created_at'),
      supabase.from('users').select('id, name, email'),
    ])
    if (list.error) toast.error(list.error.message)
    setComments(list.data ?? [])
    setAuthors(Object.fromEntries((users.data ?? []).map((u) => [u.id, u.name || u.email])))
  }, [ticketId])

  useEffect(() => {
    load()
  }, [load])

  async function send() {
    const text = draft.trim()
    if (!text || !userId) return
    setSending(true)
    const { error } = await supabase.from('comments').insert({ ticket: String(ticketId), comment: text, by: userId })
    setSending(false)
    if (error) return toast.error(error.message)
    setDraft('')
    load()
  }

  async function remove(id) {
    const { error } = await supabase.from('comments').update({ is_deleted: true }).eq('id', id)
    if (error) return toast.error(error.message)
    load()
  }

  return (
    <div className="grid gap-3 border-t pt-4">
      <Label>Commentaires</Label>

      {comments.length === 0 && <p className="text-sm text-muted-foreground">Aucun commentaire</p>}

      <div className="grid gap-2">
        {comments.map((c) => (
          <div key={c.id} className="group rounded-lg bg-muted/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{c.by === userId ? 'Moi' : authors[c.by] ?? 'Utilisateur'}</span>
                {' · '}
                {formatDate(c.created_at)}
              </span>
              {c.by === userId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                  aria-label="Supprimer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{c.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          rows={2}
          placeholder="Ex. : Plombier contacté, passe demain 9 h"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
        />
        <Button type="button" size="icon" onClick={send} disabled={sending || !draft.trim()} aria-label="Envoyer">
          <Send />
        </Button>
      </div>
    </div>
  )
}
