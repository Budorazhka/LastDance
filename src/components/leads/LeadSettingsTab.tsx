import { Info } from 'lucide-react'
import { useLeads } from '@/context/LeadsContext'
import { isLeadAdminDirector } from '@/lib/portal-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DistributionRuleType } from '@/types/leads'

const RULE_LABELS: Record<DistributionRuleType, string> = {
  round_robin: 'По кругу (round-robin)',
  by_load: 'По загрузке',
  manual: 'Только ручная раздача',
}

export function LeadSettingsTab() {
  const { state, dispatch } = useLeads()
  const isDirector = isLeadAdminDirector()
  const { distributionRule, manualDistributorId, leadManagers } = state

  if (!isDirector) {
    return (
      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
            <Info className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Только для директора</h3>
            <p className="mt-1 text-sm text-slate-600">
              Настройки раздачи доступны только директору. Вы можете просматривать облако и
              распределять лиды вручную, если вы назначены распределителем.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Правило раздачи</CardTitle>
          <p className="text-sm text-slate-600">
            Единое правило для распределения лидов из облака по менеджерам.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-700">Тип правила</Label>
            <Select
              value={distributionRule.type}
              onValueChange={(value: DistributionRuleType) => {
                dispatch({ type: 'SET_DISTRIBUTION_RULE', rule: { type: value } })
                if (value === 'round_robin' || value === 'by_load') {
                  dispatch({ type: 'SET_MANUAL_DISTRIBUTOR', managerId: null })
                }
              }}
            >
              <SelectTrigger className="w-full max-w-xs border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RULE_LABELS) as DistributionRuleType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {RULE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Менеджер в рукопашном режиме</CardTitle>
          <p className="text-sm text-slate-600">
            {distributionRule.type === 'manual'
              ? 'Кто вручную распределяет лиды. При выборе распределителя действует только ручная раздача.'
              : 'При правиле «По кругу» или «По загрузке» распределитель не используется — лиды назначаются автоматически.'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-slate-700">Распределитель</Label>
            <Select
              value={manualDistributorId ?? '_none'}
              disabled={distributionRule.type !== 'manual'}
              onValueChange={(value) => {
                const id = value === '_none' ? null : value
                dispatch({ type: 'SET_MANUAL_DISTRIBUTOR', managerId: id })
                if (id != null) {
                  dispatch({ type: 'SET_DISTRIBUTION_RULE', rule: { type: 'manual' } })
                }
              }}
            >
              <SelectTrigger className="w-full max-w-xs border-slate-200">
                <SelectValue placeholder="Не назначен" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Не назначен</SelectItem>
                {leadManagers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.login})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
