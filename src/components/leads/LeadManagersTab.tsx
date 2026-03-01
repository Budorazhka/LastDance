import { useState } from 'react'
import { Pencil, UserPlus } from 'lucide-react'
import { useLeads } from '@/context/LeadsContext'
import { isLeadAdminDirector } from '@/lib/portal-user'
import type { LeadManager, LeadSource } from '@/types/leads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const SOURCE_LABELS: Record<LeadSource, string> = {
  primary: 'Первичка',
  secondary: 'Вторичка',
  rent: 'Аренда',
  ad_campaigns: 'Рекламные кампании',
}

export function LeadManagersTab() {
  const { state, dispatch } = useLeads()
  const isDirector = isLeadAdminDirector()
  const { leadManagers } = state
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [login, setLogin] = useState('')
  const [name, setName] = useState('')
  const [sourceTypes, setSourceTypes] = useState<LeadSource[]>(['primary'])

  const isEdit = !!editingId

  const toggleSource = (s: LeadSource) => {
    setSourceTypes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const openAdd = () => {
    setEditingId(null)
    setLogin('')
    setName('')
    setSourceTypes(['primary'])
    setOpen(true)
  }

  const openEdit = (m: LeadManager) => {
    setEditingId(m.id)
    setLogin(m.login)
    setName(m.name)
    setSourceTypes([...m.sourceTypes])
    setOpen(true)
  }

  const handleAdd = () => {
    if (!login.trim() || !name.trim() || sourceTypes.length === 0) return
    const newManager: LeadManager = {
      id: `lm-${Date.now()}`,
      login: login.trim(),
      name: name.trim(),
      sourceTypes: [...sourceTypes],
    }
    dispatch({ type: 'ADD_LEAD_MANAGER', manager: newManager })
    setLogin('')
    setName('')
    setSourceTypes(['primary'])
    setOpen(false)
  }

  const handleSaveEdit = () => {
    if (!editingId || !login.trim() || !name.trim() || sourceTypes.length === 0) return
    dispatch({
      type: 'UPDATE_LEAD_MANAGER',
      managerId: editingId,
      patch: { login: login.trim(), name: name.trim(), sourceTypes: [...sourceTypes] },
    })
    setEditingId(null)
    setLogin('')
    setName('')
    setSourceTypes(['primary'])
    setOpen(false)
  }

  const closeDialog = () => {
    setOpen(false)
    setEditingId(null)
    setLogin('')
    setName('')
    setSourceTypes(['primary'])
  }

  return (
    <div className="space-y-6">
      {!isDirector && (
        <p className="text-sm text-slate-600">
          Добавление и редактирование менеджеров доступно только директору.
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Менеджеры по лидам</CardTitle>
          {isDirector && (
            <Button onClick={openAdd} className="rounded-full gap-2" size="sm">
              <UserPlus className="size-4" />
              Добавить менеджера
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {leadManagers.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">{m.name}</span>
                    <span className="ml-2 text-sm text-slate-500">{m.login}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {m.sourceTypes.map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {SOURCE_LABELS[s]}
                    </Badge>
                  ))}
                  {isDirector && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-slate-600 hover:text-slate-900"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="size-3.5" />
                        Редактировать
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-600"
                        onClick={() =>
                          dispatch({ type: 'REMOVE_LEAD_MANAGER', managerId: m.id })
                        }
                      >
                        Удалить
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Редактировать менеджера' : 'Добавить менеджера'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Логин (email)</Label>
              <Input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="manager@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Менеджеров"
              />
            </div>
            <div className="space-y-2">
              <Label>Очереди (типы аккаунтов / права)</Label>
              <div className="flex flex-wrap gap-2">
                {(['primary', 'secondary', 'rent', 'ad_campaigns'] as LeadSource[]).map(
                  (s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={sourceTypes.includes(s) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSource(s)}
                    >
                      {SOURCE_LABELS[s]}
                    </Button>
                  )
                )}
              </div>
              <p className="text-xs text-slate-500">
                Выберите очереди, к которым у менеджера есть доступ.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Отмена
            </Button>
            {isEdit ? (
              <Button onClick={handleSaveEdit} disabled={!login.trim() || !name.trim() || sourceTypes.length === 0}>
                Сохранить
              </Button>
            ) : (
              <Button onClick={handleAdd} disabled={!login.trim() || !name.trim() || sourceTypes.length === 0}>
                Добавить
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
