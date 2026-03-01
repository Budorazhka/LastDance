import { useMemo, useState } from 'react'
import { User, Users } from 'lucide-react'
import { useLeads } from '@/context/LeadsContext'
import { LEAD_STAGES } from '@/data/leads-mock'
import type { LeadSource } from '@/types/leads'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { FunnelBoard, FunnelColumn, FunnelStage } from '@/types/analytics'
import { getAnalyticsData } from '@/lib/mock/analytics-network'
import { ConversionOverviewChart, FunnelKanban } from '@/components/analytics-network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SOURCE_LABELS: Record<LeadSource, string> = {
  primary: 'Первичка',
  secondary: 'Вторичка',
  rent: 'Аренда',
  ad_campaigns: 'Рекламные кампании',
}

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'allTime', label: 'Всё время' },
]

/** Строим воронку из лидов облака (по стадиям LEAD_STAGES) для выбранного набора лидов */
function buildFunnelFromLeads(leads: { stageId: string }[]): FunnelBoard {
  const stages: FunnelStage[] = LEAD_STAGES.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    count: leads.filter((l) => l.stageId === s.id).length,
  }))
  const column: FunnelColumn = {
    id: 'in_progress',
    name: 'В работе',
    count: stages.reduce((sum, s) => sum + s.count, 0),
    stages,
  }
  const totalCount = column.count
  const closedCount = stages.find((s) => s.id === 'deal')?.count ?? 0
  return {
    id: 'sales',
    name: 'Продажи',
    shortName: 'Продажи',
    totalCount,
    activeCount: totalCount - closedCount,
    rejectionCount: 0,
    closedCount,
    columns: [column],
  }
}

/** Аналитика лидов: воронка продаж (этапы CRM как в канбане) + источники + менеджеры */
export function LeadAnalyticsTab() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('_all')
  const { state } = useLeads()
  const { leadPool, leadManagers } = state

  /** Лиды для текущего среза: вся сеть или один менеджер */
  const filteredLeads = useMemo(() => {
    if (selectedManagerId === '_all') return leadPool
    if (selectedManagerId === '_unassigned') return leadPool.filter((l) => !l.managerId)
    return leadPool.filter((l) => l.managerId === selectedManagerId)
  }, [leadPool, selectedManagerId])

  const analyticsData = useMemo(() => getAnalyticsData(period), [period])
  const salesFunnelFromApi = useMemo(
    () => analyticsData.funnels.find((f) => f.id === 'sales') ?? null,
    [analyticsData.funnels]
  )

  /** Воронка: по всей сети — из API, по менеджеру — из облака лидов */
  const salesFunnel = useMemo(() => {
    if (selectedManagerId === '_all') return salesFunnelFromApi
    return buildFunnelFromLeads(filteredLeads)
  }, [selectedManagerId, salesFunnelFromApi, filteredLeads])

  const flowsBySource = useMemo(() => {
    const map: Record<LeadSource, number> = {
      primary: 0,
      secondary: 0,
      rent: 0,
      ad_campaigns: 0,
    }
    filteredLeads.forEach((l) => {
      map[l.source]++
    })
    return map
  }, [filteredLeads])

  const totalLeads = filteredLeads.length
  const maxFlow = Math.max(...Object.values(flowsBySource), 1)

  /** Менеджеры по стадиям: managerId -> stageId -> count */
  const managerStageCounts = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    leadPool.forEach((lead) => {
      const mid = lead.managerId ?? '_unassigned'
      if (!map[mid]) map[mid] = {}
      map[mid][lead.stageId] = (map[mid][lead.stageId] ?? 0) + 1
    })
    return map
  }, [leadPool])

  const managerIds = useMemo(() => {
    const set = new Set<string>(Object.keys(managerStageCounts))
    return Array.from(set).filter((id) => id !== '_unassigned')
  }, [managerStageCounts])

  const getManagerName = (id: string) => {
    if (id === '_unassigned') return 'Не назначен'
    return leadManagers.find((m) => m.id === id)?.name ?? id
  }

  const scopeLabel =
    selectedManagerId === '_all'
      ? 'Вся сеть'
      : selectedManagerId === '_unassigned'
        ? 'Не назначен'
        : getManagerName(selectedManagerId)

  return (
    <div className="space-y-10">
      {/* Выбор среза: вся сеть или конкретный менеджер */}
      <Card className="border-slate-200 bg-slate-50/30">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            {selectedManagerId === '_all' ? (
              <Users className="size-5 text-slate-600" />
            ) : (
              <User className="size-5 text-slate-600" />
            )}
            <span className="text-sm font-medium text-slate-700">Показать аналитику:</span>
          </div>
          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
            <SelectTrigger className="w-full min-w-[220px] max-w-sm border-slate-200 bg-white">
              <SelectValue placeholder="Выберите срез" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Вся сеть (все менеджеры)</SelectItem>
              {leadManagers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
              <SelectItem value="_unassigned">Не назначен</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">
            Сейчас: <span className="font-medium text-slate-700">{scopeLabel}</span>
          </span>
        </CardContent>
      </Card>

      {/* Воронка продаж — те же этапы CRM, что и в канбане на странице партнёра */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Воронка продаж</h2>
            <p className="mt-1 text-sm text-slate-600">
              Все этапы CRM в соответствии с воронкой в канбане. Конверсии и разбивка по стадиям.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors ' +
                  (period === opt.value
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {salesFunnel ? (
          <div className="space-y-6">
            <ConversionOverviewChart funnel={salesFunnel} className="h-full" />
            <FunnelKanban funnels={[salesFunnel]} />
          </div>
        ) : (
          <Card className="border-slate-200 bg-slate-50/50">
            <CardContent className="py-10 text-center text-slate-600">
              Нет данных по воронке продаж за выбранный период.
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="section-title mb-1">Куда сливается лидогенерация</h2>
        <p className="mb-5 text-sm text-slate-600">
          {selectedManagerId === '_all'
            ? 'Объёмы лидов по типам аккаунтов (очередям) по всей сети.'
            : `Объёмы лидов по очередям для выбранного среза (${scopeLabel}).`}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((source) => {
            const count = flowsBySource[source]
            const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0
            const barPct = maxFlow ? Math.round((count / maxFlow) * 100) : 0
            return (
              <Card key={source} className="overflow-hidden">
                <CardHeader className="pb-1">
                  <CardTitle className="text-base font-semibold">{SOURCE_LABELS[source]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">{count}</div>
                  <p className="text-xs text-slate-500">{pct}% от общего</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-700 transition-[width] duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Аналитика по менеджерам</h2>
            <p className="mt-1 text-sm text-slate-600">
              Сколько лидов у менеджера на каждой стадии воронки. Выберите менеджера или смотрите сводку по всем.
            </p>
          </div>
          <div className="flex min-w-[200px] flex-col gap-2">
            <Label className="text-slate-600">Менеджер для аналитики</Label>
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите менеджера" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Все менеджеры</SelectItem>
                {leadManagers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
                <SelectItem value="_unassigned">Не назначен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedManagerId !== '_all' ? (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-5 text-slate-600" />
                {getManagerName(selectedManagerId)}
              </CardTitle>
              <p className="text-sm text-slate-600">
                Разбивка лидов по стадиям воронки
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
                {(managerStageCounts[selectedManagerId] && LEAD_STAGES.map((stage) => {
                  const count = managerStageCounts[selectedManagerId]?.[stage.id] ?? 0
                  const total = LEAD_STAGES.reduce(
                    (sum, s) => sum + (managerStageCounts[selectedManagerId]?.[s.id] ?? 0),
                    0
                  )
                  const pct = total ? Math.round((count / total) * 100) : 0
                  return (
                    <div
                      key={stage.id}
                      className="border-b border-slate-100 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r"
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        {stage.name}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{count}</p>
                      <p className="text-xs text-slate-500">{pct}% от лидов менеджера</p>
                    </div>
                  )
                })) ?? (
                  <div className="col-span-full px-4 py-8 text-center text-slate-500">
                    Нет лидов у выбранного менеджера
                  </div>
                )}
              </div>
              {managerStageCounts[selectedManagerId] && (
                <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Итого: {LEAD_STAGES.reduce(
                      (sum, s) => sum + (managerStageCounts[selectedManagerId]?.[s.id] ?? 0),
                      0
                    )} лидов
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Менеджер
                      </th>
                      {LEAD_STAGES.map((s) => (
                        <th key={s.id} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {s.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Итого
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerIds.map((mid, i) => {
                      const row = managerStageCounts[mid] ?? {}
                      const total = LEAD_STAGES.reduce((sum, s) => sum + (row[s.id] ?? 0), 0)
                      return (
                        <tr
                          key={mid}
                          className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">{getManagerName(mid)}</td>
                          {LEAD_STAGES.map((s) => (
                            <td key={s.id} className="px-4 py-3 text-right text-slate-700">
                              {row[s.id] ?? 0}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{total}</td>
                        </tr>
                      )
                    })}
                    {managerStageCounts['_unassigned'] && (
                      <tr className="border-t border-slate-200 bg-slate-100/70">
                        <td className="px-4 py-3 font-medium text-slate-700">{getManagerName('_unassigned')}</td>
                        {LEAD_STAGES.map((s) => (
                          <td key={s.id} className="px-4 py-3 text-right text-slate-600">
                            {managerStageCounts['_unassigned']?.[s.id] ?? 0}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {Object.values(managerStageCounts['_unassigned'] ?? {}).reduce(
                            (a, b) => a + b,
                            0
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
