import { useMemo, useState } from 'react'
import { User, Users } from 'lucide-react'
import { useLeads } from '@/context/LeadsContext'
import { LEAD_STAGES, LEAD_STAGE_COLUMN } from '@/data/leads-mock'
import type { LeadSource } from '@/types/leads'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { FunnelBoard, FunnelColumn, FunnelStage } from '@/types/analytics'
import { getAnalyticsData } from '@/lib/mock/analytics-network'
import { ConversionOverviewChart, FunnelKanban } from '@/components/analytics-network'
import { LeadsCardTableDialog } from '@/components/leads/LeadsCardTableDialog'
import { LeadsCardTableV2Dialog } from '@/components/leads/LeadsCardTableV2Dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Включить кнопку и диалог «Карточный стол лидов» (старая версия). false = скрыто. */
const SHOW_LEGACY_CARD_TABLE = false

/** Иконка карточного стола (игральные карты) */
function CardTableIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="1" width="15" height="21" rx="2.2" />
      <rect x="7" y="3" width="15" height="21" rx="2.2" />
      <path d="M19.5 8.5l1.5 2.5-1.5 2.5-1.5-2.5 1.5-2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

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
  const [cardTableOpen, setCardTableOpen] = useState(false)
  const [cardTableV2Open, setCardTableV2Open] = useState(false)
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

  /** KPI для дашборда: по воронке или по filteredLeads */
  const kpiTotal = salesFunnel?.totalCount ?? filteredLeads.length
  const kpiClosed = salesFunnel?.closedCount ?? filteredLeads.filter((l) => l.stageId === 'deal').length
  const kpiInProgress = salesFunnel?.activeCount ?? filteredLeads.length - kpiClosed
  const kpiConversion = kpiTotal > 0 ? Math.round((kpiClosed / kpiTotal) * 100) : 0

  /** Сводка по каждому менеджеру: всего, в работе, закрыто, отказ, конверсия %, место в рейтинге */
  const managerStats = useMemo(() => {
    const list: Array<{
      managerId: string
      name: string
      total: number
      inProgress: number
      closed: number
      rejection: number
      conversionPct: number
      goodPct: number
      badPct: number
    }> = []
    managerIds.forEach((mid) => {
      const row = managerStageCounts[mid] ?? {}
      let total = 0
      let closed = 0
      let rejection = 0
      LEAD_STAGES.forEach((s) => {
        const c = row[s.id] ?? 0
        total += c
        if (s.id === 'deal') closed = c
        if (LEAD_STAGE_COLUMN[s.id] === 'rejection') rejection += c
      })
      const inProgress = total - closed - rejection
      const conversionPct = total > 0 ? Math.round((closed / total) * 100) : 0
      const goodPct = total > 0 ? Math.round((closed / total) * 100) : 0
      const badPct = total > 0 ? Math.round((rejection / total) * 100) : 0
      list.push({
        managerId: mid,
        name: getManagerName(mid),
        total,
        inProgress,
        closed,
        rejection,
        conversionPct,
        goodPct,
        badPct,
      })
    })
    return list.sort((a, b) => b.conversionPct - a.conversionPct || b.closed - a.closed)
  }, [managerIds, managerStageCounts])

  /** Рейтинг: место по конверсии (1-based) */
  const managerRankByConversion = useMemo(() => {
    const order = managerStats.map((m) => m.managerId)
    const rank: Record<string, number> = {}
    order.forEach((id, i) => {
      rank[id] = i + 1
    })
    return rank
  }, [managerStats])

  const avgConversion =
    managerStats.length > 0
      ? Math.round(managerStats.reduce((s, m) => s + m.conversionPct, 0) / managerStats.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Выбор среза: вся сеть или конкретный менеджер */}
      <Card className="leads-card border-slate-200 bg-slate-50/30">
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
            <SelectTrigger className="leads-select-trigger w-full min-w-[220px] max-w-sm border-slate-200 bg-white">
              <SelectValue placeholder="Выберите срез" />
            </SelectTrigger>
            <SelectContent className="leads-select-content">
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
          {SHOW_LEGACY_CARD_TABLE && (
          <Button
            variant="outline"
            className="gap-2 border-[rgba(229,196,136,0.6)] bg-[rgba(68,43,18,0.5)] text-[#fcecc8] hover:border-[rgba(236,194,112,0.7)] hover:bg-[rgba(88,57,25,0.65)] hover:text-[#fff5e0]"
            onClick={() => setCardTableOpen(true)}
          >
            <CardTableIcon className="size-4 shrink-0" />
            Карточный стол лидов
          </Button>
        )}
          <Button
            variant="outline"
            className="gap-2 border-[rgba(229,196,136,0.6)] bg-[rgba(68,43,18,0.5)] text-[#fcecc8] hover:border-[rgba(236,194,112,0.7)] hover:bg-[rgba(88,57,25,0.65)] hover:text-[#fff5e0]"
            onClick={() => setCardTableV2Open(true)}
          >
            <CardTableIcon className="size-4 shrink-0" />
            Карточный стол лидов v2
          </Button>
        </CardContent>
      </Card>

      {SHOW_LEGACY_CARD_TABLE && (
        <LeadsCardTableDialog
          open={cardTableOpen}
          onOpenChange={setCardTableOpen}
          selectedManagerId={selectedManagerId}
          onSelectedManagerIdChange={setSelectedManagerId}
          period={period}
          onPeriodChange={setPeriod}
        />
      )}

      <LeadsCardTableV2Dialog
        open={cardTableV2Open}
        onOpenChange={setCardTableV2Open}
        selectedManagerId={selectedManagerId}
        onSelectedManagerIdChange={setSelectedManagerId}
      />

      {/* Светлый блок дашборда (без картежной темы) */}
      <div className="leads-analytics-dashboard space-y-6">
        {/* Компактная строка KPI */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="dashboard-kpi-card">
            <div className="kpi-value">{kpiTotal.toLocaleString('ru-RU')}</div>
            <div className="kpi-label">Всего лидов</div>
          </div>
          <div className="dashboard-kpi-card">
            <div className="kpi-value">{kpiInProgress.toLocaleString('ru-RU')}</div>
            <div className="kpi-label">В работе</div>
          </div>
          <div className="dashboard-kpi-card">
            <div className="kpi-value">{kpiClosed.toLocaleString('ru-RU')}</div>
            <div className="kpi-label">Закрыто в сделку</div>
          </div>
          <div className="dashboard-kpi-card">
            <div className="kpi-value">{kpiConversion}%</div>
            <div className="kpi-label">Конверсия лид → сделка</div>
          </div>
        </div>

        {/* Воронка продаж */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Воронка продаж</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Все этапы CRM в соответствии с воронкой в канбане. Конверсии и разбивка по стадиям.
              </p>
            </div>
            <div className="leads-period-toggle inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
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
            <div className="space-y-4">
              <ConversionOverviewChart funnel={salesFunnel} className="h-full" variant="leads" />
              <FunnelKanban funnels={[salesFunnel]} variant="leads" />
          </div>
          ) : (
            <Card className="leads-card border-slate-200 bg-slate-50/50">
              <CardContent className="py-8 text-center text-slate-600">
                Нет данных по воронке продаж за выбранный период.
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="section-title mb-1">Куда сливается лидогенерация</h2>
          <p className="mb-4 text-sm text-slate-600">
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
              <Card key={source} className="leads-card overflow-hidden">
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

        {/* Сравнительная таблица по менеджерам */}
        <section>
          <h2 className="section-title mb-1">Сравнение по менеджерам</h2>
          <p className="mb-4 text-sm text-slate-600">
            Сводка и рейтинг по конверсии в сделку. Место — по убыванию конверсии.
          </p>
          <Card className="leads-card overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Место</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Менеджер</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Всего</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">В работе</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Закрыто</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Отказ</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Конверсия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerStats.map((m, i) => (
                      <tr
                        key={m.managerId}
                        className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${selectedManagerId === m.managerId ? 'ring-inset ring-1 ring-amber-400/50' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-700">
                            {managerRankByConversion[m.managerId]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{m.name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{m.total}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{m.inProgress}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 font-medium">{m.closed}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-red-700/90">{m.rejection}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="tabular-nums font-semibold text-slate-900">{m.conversionPct}%</span>
                        </td>
                      </tr>
                    ))}
                    {managerStats.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Нет данных по менеджерам
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Аналитика по менеджерам</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Сколько лидов у менеджера на каждой стадии воронки. Выберите менеджера или смотрите сводку по всем.
              </p>
            </div>
            <div className="flex min-w-[200px] flex-col gap-2">
            <Label className="text-slate-600">Менеджер для аналитики</Label>
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger className="leads-select-trigger w-full">
                <SelectValue placeholder="Выберите менеджера" />
              </SelectTrigger>
              <SelectContent className="leads-select-content">
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
          <div className="space-y-4">
            {selectedManagerId !== '_unassigned' && managerStats.find((m) => m.managerId === selectedManagerId) && (() => {
              const stat = managerStats.find((m) => m.managerId === selectedManagerId)!
              const place = managerRankByConversion[selectedManagerId]
              const totalManagers = managerStats.length
              const aboveAvg = stat.conversionPct >= avgConversion
              return (
                <Card className="leads-card overflow-hidden border-amber-500/30">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber-500/25 text-sm font-bold text-amber-200">
                        {place}
                      </span>
                      Рейтинг: {stat.name}
                    </CardTitle>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>
                        <strong className="text-slate-800">{place} место</strong> из {totalManagers} по конверсии в сделку
                      </span>
                      <span className={aboveAvg ? 'text-emerald-600' : 'text-amber-600'}>
                        {aboveAvg ? 'Выше' : 'Ниже'} среднего на {Math.abs(stat.conversionPct - avgConversion)} п.п. (среднее {avgConversion}%)
                      </span>
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Доля исходов:</span>
                      <div className="flex h-2 flex-1 max-w-xs overflow-hidden rounded-full bg-slate-700/30">
                        <div
                          className="bg-emerald-500/90"
                          style={{ width: `${stat.goodPct}%` }}
                          title="Закрыто в сделку"
                        />
                        <div
                          className="bg-amber-500/70"
                          style={{ width: `${100 - stat.goodPct - stat.badPct}%` }}
                          title="В работе"
                        />
                        <div
                          className="bg-red-500/70"
                          style={{ width: `${stat.badPct}%` }}
                          title="Отказ"
                        />
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">
                        закрыто {stat.goodPct}% · в работе {100 - stat.goodPct - stat.badPct}% · отказ {stat.badPct}%
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              )
            })()}
            <Card className="leads-card overflow-hidden">
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
          </div>
        ) : (
          <Card className="leads-card overflow-hidden">
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
    </div>
  )
}
