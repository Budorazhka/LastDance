"use client"

import { useMemo, useState } from "react"
import { Filter, Search, X } from "lucide-react"
import { useLeads } from "@/context/LeadsContext"
import type { AnalyticsPeriod } from "@/types/analytics"
import type { Lead } from "@/types/leads"
import { LEAD_STAGES, LEAD_STAGE_COLUMN } from "@/data/leads-mock"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const IN_PROGRESS_STAGES = LEAD_STAGES.filter(
  (stage) => LEAD_STAGE_COLUMN[stage.id] === "in_progress"
)
const REJECTION_STAGES = LEAD_STAGES.filter(
  (stage) => LEAD_STAGE_COLUMN[stage.id] === "rejection"
)
const SUCCESS_STAGES = LEAD_STAGES.filter(
  (stage) => LEAD_STAGE_COLUMN[stage.id] === "success"
)

const REJECTION_STAGE_IDS = new Set(
  LEAD_STAGES.filter((stage) => LEAD_STAGE_COLUMN[stage.id] === "rejection").map((stage) => stage.id)
)

function managerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getLeadProblemState(lead: Lead): "neutral" | "critical" {
  if (REJECTION_STAGE_IDS.has(lead.stageId)) return "critical"
  if (!lead.managerId || lead.hasTask === false) return "critical"
  return "neutral"
}

function getDeckVisualState(stageId: string, leads: Lead[]): "neutral" | "critical" {
  if (REJECTION_STAGE_IDS.has(stageId)) return "critical"
  if (leads.length === 0) return "neutral"
  return leads.some((lead) => getLeadProblemState(lead) === "neutral") ? "neutral" : "critical"
}

function managerLabel(managerId: string | null, managerNameById: Record<string, string>): string {
  if (!managerId) return "Не назначен"
  return managerNameById[managerId] ?? managerId
}

function stageTopArcPosition(index: number, total: number): { x: number; y: number } {
  const ratio = total <= 1 ? 0 : index / (total - 1)
  const x = 5 + ratio * 90
  const arc = Math.sin(ratio * Math.PI)
  const y = 17 - arc * 14
  return { x, y }
}

function visibleLeadCards(leads: Lead[], cursor: number): Lead[] {
  if (leads.length === 0) return []
  const count = Math.min(3, leads.length)
  return Array.from({ length: count }, (_, idx) => leads[(cursor + idx) % leads.length])
}

export function LeadsCardTableV2Dialog({
  open,
  onOpenChange,
  selectedManagerId,
  onSelectedManagerIdChange,
  period,
  onPeriodChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedManagerId: string
  onSelectedManagerIdChange: (id: string) => void
  period: AnalyticsPeriod
  onPeriodChange: (p: AnalyticsPeriod) => void
}) {
  const { state } = useLeads()
  const { leadPool, leadManagers } = state
  const [cursorByStageId, setCursorByStageId] = useState<Record<string, number>>({})
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [filterNoTask, setFilterNoTask] = useState(false)
  const [filterNoManager, setFilterNoManager] = useState(false)

  const managerNameById = useMemo(() => {
    const map: Record<string, string> = {}
    leadManagers.forEach((manager) => {
      map[manager.id] = manager.name
    })
    return map
  }, [leadManagers])

  const filteredLeads = useMemo(() => {
    let list = leadPool
    if (selectedManagerId === "_unassigned") list = list.filter((lead) => !lead.managerId)
    else if (selectedManagerId !== "_all") list = list.filter((lead) => lead.managerId === selectedManagerId)

    const term = q.trim().toLowerCase()
    if (term) {
      list = list.filter((lead) => (lead.name ?? lead.id).toLowerCase().includes(term))
    }

    if (filterNoTask || filterNoManager) {
      list = list.filter((lead) => {
        if (filterNoTask && filterNoManager) return !lead.hasTask || !lead.managerId
        if (filterNoTask) return !lead.hasTask
        return !lead.managerId
      })
    }

    return list
  }, [leadPool, selectedManagerId, q, filterNoTask, filterNoManager])

  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    LEAD_STAGES.forEach((stage) => {
      map[stage.id] = []
    })
    filteredLeads.forEach((lead) => {
      if (map[lead.stageId]) map[lead.stageId].push(lead)
    })
    return map
  }, [filteredLeads])

  const totals = useMemo(() => {
    const critical = filteredLeads.filter((lead) => getLeadProblemState(lead) === "critical").length
    const rejection = filteredLeads.filter((lead) => REJECTION_STAGE_IDS.has(lead.stageId)).length
    const healthy = Math.max(0, filteredLeads.length - critical)
    return {
      total: filteredLeads.length,
      critical,
      healthy,
      rejection,
    }
  }, [filteredLeads])

  const dealerName =
    selectedManagerId === "_all"
      ? "Менеджеры: вся сеть"
      : selectedManagerId === "_unassigned"
        ? "Не назначен"
        : leadManagers.find((manager) => manager.id === selectedManagerId)?.name ?? selectedManagerId

  const centerBrief = useMemo(() => {
    const inProgress = IN_PROGRESS_STAGES.reduce(
      (sum, stage) => sum + (leadsByStage[stage.id]?.length ?? 0),
      0
    )
    const noTask = filteredLeads.filter((lead) => lead.hasTask === false).length
    const noManager = filteredLeads.filter((lead) => !lead.managerId).length
    const riskPct = totals.total > 0 ? Math.round((totals.critical / totals.total) * 100) : 0

    let bottleneckName = "нет данных"
    let bottleneckCount = 0
    IN_PROGRESS_STAGES.forEach((stage) => {
      const count = leadsByStage[stage.id]?.length ?? 0
      if (count > bottleneckCount) {
        bottleneckCount = count
        bottleneckName = stage.name
      }
    })

    const scope = selectedManagerId === "_all" ? "Сеть" : dealerName
    const focus =
      noTask === 0 && noManager === 0
        ? "Фокус смены: держим темп"
        : noTask >= noManager
          ? `Фокус смены: закрыть без задач — ${noTask}`
          : `Фокус смены: назначить менеджера — ${noManager}`
    const focusShort =
      noTask === 0 && noManager === 0
        ? "держим темп"
        : noTask >= noManager
          ? `закрыть без задач (${noTask})`
          : `назначить менеджера (${noManager})`

    return {
      scope,
      inProgress,
      noTask,
      noManager,
      riskPct,
      bottleneckName,
      bottleneckCount,
      focus,
      focusShort,
    }
  }, [filteredLeads, leadsByStage, totals, selectedManagerId, dealerName])

  const fallbackLead = filteredLeads[0] ?? null
  const activeLead = selectedLeadId
    ? filteredLeads.find((lead) => lead.id === selectedLeadId) ?? fallbackLead
    : fallbackLead
  const activeStage = activeLead
    ? LEAD_STAGES.find((stage) => stage.id === activeLead.stageId) ?? null
    : null
  const activityDate = activeLead
    ? new Date(activeLead.updatedAt ?? activeLead.createdAt)
    : null
  const activityLabel = activityDate
    ? `${activityDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}, ${activityDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
    : "—"
  const taskOk = activeLead ? activeLead.hasTask !== false : false
  const managerOk = activeLead ? Boolean(activeLead.managerId) : false

  const stepStage = (stageId: string, leads: Lead[], direction: 1 | -1) => {
    if (leads.length === 0) return
    setCursorByStageId((current) => {
      const safeCurrent = (current[stageId] ?? 0) % leads.length
      const next =
        direction === 1
          ? (safeCurrent + 1) % leads.length
          : (safeCurrent - 1 + leads.length) % leads.length
      setSelectedLeadId(leads[next]?.id ?? leads[0]?.id ?? null)
      return { ...current, [stageId]: next }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !m-0 !h-screen !w-screen !max-w-none !rounded-none !border-0 !p-0 overflow-hidden flex flex-col bg-[#0f6e50]"
      >
        <DialogHeader className="h-11 shrink-0 border-b border-emerald-200/25 bg-[#0c5a42] px-3">
          <div className="flex h-full items-center gap-2">
            <DialogTitle className="sr-only">Карточный стол лидов v2</DialogTitle>
            <DialogDescription className="sr-only">Blackjack расклад лидов</DialogDescription>

            <Label className="text-[11px] uppercase tracking-wide text-emerald-100">Менеджер</Label>
            <Select value={selectedManagerId} onValueChange={onSelectedManagerIdChange}>
              <SelectTrigger className="h-7 w-[190px] border-emerald-500 bg-emerald-900/35 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Вся сеть</SelectItem>
                {leadManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
                <SelectItem value="_unassigned">Не назначен</SelectItem>
              </SelectContent>
            </Select>

            <Label className="ml-2 text-[11px] uppercase tracking-wide text-emerald-100">Период</Label>
            <Select value={period} onValueChange={(value) => onPeriodChange(value as AnalyticsPeriod)}>
              <SelectTrigger className="h-7 w-[120px] border-emerald-500 bg-emerald-900/35 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="allTime">Всё время</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 border-emerald-300/55 bg-emerald-800/35 px-2 text-xs text-emerald-50 hover:bg-emerald-700/70"
                >
                  <Filter className="size-3.5" />
                  Фильтры
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[190px] border-emerald-500 bg-emerald-900 text-emerald-50"
              >
                <DropdownMenuLabel className="text-xs uppercase tracking-wide text-emerald-200">
                  Показать
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filterNoTask}
                  onCheckedChange={(v) => setFilterNoTask(v === true)}
                  className="text-sm focus:bg-emerald-700 focus:text-white"
                >
                  Без задач
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterNoManager}
                  onCheckedChange={(v) => setFilterNoManager(v === true)}
                  className="text-sm focus:bg-emerald-700 focus:text-white"
                >
                  Без менеджера
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-emerald-200" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по имени"
                className="h-7 w-[170px] border-emerald-500 bg-emerald-900/35 pl-7 text-xs text-white placeholder:text-emerald-200"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="ml-auto h-7 gap-1 border-emerald-300/45 bg-emerald-950/30 px-2 text-xs text-emerald-50 hover:bg-emerald-800/70"
            >
              <X className="size-3.5" />
              Закрыть
            </Button>
          </div>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-auto bg-[#0f6e50]">
          <div
            className="relative mx-auto h-full min-h-[760px] min-w-[1460px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <div className="absolute left-8 right-[310px] top-2 h-[405px]">
              {IN_PROGRESS_STAGES.map((stage, index) => {
                const leads = leadsByStage[stage.id] ?? []
                const baseCursor = cursorByStageId[stage.id] ?? 0
                const safeCursor = leads.length > 0 ? baseCursor % leads.length : 0
                const pos = stageTopArcPosition(index, IN_PROGRESS_STAGES.length)

                return (
                  <div
                    key={stage.id}
                    className="absolute w-[104px]"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, 0)" }}
                  >
                    <StageDeckPile
                      stageId={stage.id}
                      stageLabel={`Этап ${index + 1}`}
                      stageName={stage.name}
                      leads={leads}
                      cursor={safeCursor}
                      onStep={stepStage}
                      onSelect={setSelectedLeadId}
                      activeLeadId={activeLead?.id ?? null}
                      showControls={leads.length > 1}
                    />
                  </div>
                )
              })}
            </div>

            <div className="absolute left-1/2 top-[60%] h-[308px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-amber-300/90">
              <div className="absolute inset-[20px] rounded-[50%] border border-amber-200/85" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="space-y-1.5 text-center text-[24px] leading-tight text-emerald-50 [text-shadow:_0_2px_4px_rgba(0,0,0,0.38)]"
                  style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="cursor-help">Сеть под контролем</p>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                      Область расчета: лиды после текущих фильтров (менеджер, поиск, флаги «Без задач» и «Без менеджера»).
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="cursor-help">Активные лиды: {centerBrief.inProgress}</p>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                      Считается как сумма лидов на всех этапах колонки «В работе» (in_progress) в текущей выборке.
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="cursor-help">Проблемные: {totals.critical}</p>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                      Это лиды без менеджера, без задачи или на отказных этапах. Источник: текущая выборка лидов.
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="cursor-help">
                        Узкое место: {centerBrief.bottleneckName} ({centerBrief.bottleneckCount})
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                      Этап с максимальным количеством лидов среди этапов «В работе». Название и число берутся из распределения по этапам.
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="cursor-help">Следующий шаг: {centerBrief.focusShort}</p>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                      Автоматическая рекомендация: если больше лидов без задач, фокус на задачах; если без менеджера, фокус на назначении.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="absolute bottom-2 left-8 flex items-end gap-2">
              {REJECTION_STAGES.map((stage) => {
                const leads = leadsByStage[stage.id] ?? []
                const baseCursor = cursorByStageId[stage.id] ?? 0
                const safeCursor = leads.length > 0 ? baseCursor % leads.length : 0
                return (
                  <div key={stage.id} className="w-[104px]">
                    <StageDeckPile
                      stageId={stage.id}
                      stageLabel={stage.name}
                      leads={leads}
                      cursor={safeCursor}
                      onStep={stepStage}
                      onSelect={setSelectedLeadId}
                      activeLeadId={activeLead?.id ?? null}
                      showControls={leads.length > 1}
                      compact
                    />
                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-2 right-6 flex items-end gap-2">
              {SUCCESS_STAGES.map((stage) => {
                const leads = leadsByStage[stage.id] ?? []
                const baseCursor = cursorByStageId[stage.id] ?? 0
                const safeCursor = leads.length > 0 ? baseCursor % leads.length : 0
                return (
                  <div key={stage.id} className="w-[104px]">
                    <StageDeckPile
                      stageId={stage.id}
                      stageLabel={stage.name}
                      leads={leads}
                      cursor={safeCursor}
                      onStep={stepStage}
                      onSelect={setSelectedLeadId}
                      activeLeadId={activeLead?.id ?? null}
                      showControls={leads.length > 1}
                      compact
                    />
                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex h-[66px] min-w-[208px] items-center gap-2 rounded-[10px] border border-emerald-200/80 bg-emerald-50/95 px-3 text-emerald-950 shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                <Avatar className="size-9 border border-emerald-300">
                  <AvatarFallback className="bg-emerald-700 text-xs font-semibold text-white">
                    {managerInitials(dealerName || "MN")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Менеджер</p>
                  <p className="truncate text-[16px] font-semibold leading-tight text-emerald-950">{dealerName}</p>
                </div>
              </div>
            </div>

            <aside className="absolute right-2 top-2 w-[300px] rounded-[6px] border border-emerald-300/40 bg-[#c7d8d2] px-4 py-3 text-slate-900 shadow-[0_10px_20px_rgba(0,0,0,0.28)]">
              <p className="text-[14px] font-bold uppercase leading-none tracking-wide text-slate-500">РАСКЛАД</p>
              <div className="mt-3 rounded-[14px] border-2 border-indigo-200 bg-slate-100 px-3 py-3 text-center">
                <p className="line-clamp-2 text-[18px] font-bold leading-tight text-slate-800">
                  {activeLead?.name ?? "—"}
                </p>
                <p className="mt-1 line-clamp-1 text-[14px] font-semibold text-slate-500">
                  {activeStage?.name ?? "Нет этапа"}
                </p>
              </div>

              <div
                className={cn(
                  "mt-3 rounded-[12px] border-2 px-3 py-2.5",
                  taskOk ? "border-emerald-400 bg-emerald-50/40" : "border-rose-400 bg-rose-50/60"
                )}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Задача</p>
                <p className={cn("text-[20px] font-bold leading-tight", taskOk ? "text-emerald-700" : "text-rose-700")}>
                  {taskOk ? "Да" : "Нет"}
                </p>
              </div>

              <div
                className={cn(
                  "mt-3 rounded-[12px] border-2 px-3 py-2.5",
                  managerOk ? "border-emerald-400 bg-emerald-50/40" : "border-rose-400 bg-rose-50/60"
                )}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Менеджер</p>
                <p className={cn("line-clamp-1 text-[19px] font-bold leading-tight", managerOk ? "text-emerald-700" : "text-rose-700")}>
                  {activeLead ? managerLabel(activeLead.managerId, managerNameById) : "—"}
                </p>
              </div>

              <div className="mt-3 rounded-[12px] border-2 border-indigo-100 bg-slate-100 px-3 py-2.5">
                <p className="cursor-help text-[12px] font-semibold uppercase tracking-wide text-slate-500" title="движение по воронке">
                  Прогресс
                </p>
                <p className="text-[20px] font-bold leading-tight text-slate-800">
                  {activityLabel}
                </p>
              </div>
              <div className="mt-3 min-h-[76px] rounded-[12px] border-2 border-dashed border-slate-300/80 bg-slate-50/50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Резерв под данные</p>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StageDeckPile({
  stageId,
  stageLabel,
  stageName,
  leads,
  cursor,
  onStep,
  onSelect,
  activeLeadId,
  showControls,
  compact = false,
}: {
  stageId: string
  stageLabel: string
  stageName?: string
  leads: Lead[]
  cursor: number
  onStep: (stageId: string, leads: Lead[], direction: 1 | -1) => void
  onSelect: (leadId: string) => void
  activeLeadId: string | null
  showControls: boolean
  compact?: boolean
}) {
  const cards = visibleLeadCards(leads, cursor)
  const hiddenCount = Math.max(0, leads.length - cards.length)
  const hiddenLayers = Math.min(compact ? 7 : 10, hiddenCount)
  const deckTone = getDeckVisualState(stageId, leads)

  const cardWidth = 95
  const cardHeight = 142
  const pileHeight = 270
  const cardStep = 27

  return (
    <>
      <div className="mb-1 flex h-6 items-center justify-center gap-1.5">
        {showControls ? (
          <>
            <button
              type="button"
              onClick={() => onStep(stageId, leads, -1)}
              className="h-5 min-w-[32px] rounded border border-rose-300 bg-rose-600 px-1 text-[11px] font-bold text-white"
            >
              ◂♦
            </button>
            <button
              type="button"
              onClick={() => onStep(stageId, leads, 1)}
              className="h-5 min-w-[32px] rounded border border-rose-300 bg-rose-600 px-1 text-[11px] font-bold text-white"
            >
              ♦▸
            </button>
          </>
        ) : (
          <>
            <span className="h-5 min-w-[32px] opacity-0">◂♦</span>
            <span className="h-5 min-w-[32px] opacity-0">♦▸</span>
          </>
        )}
      </div>

      <div className={cn("mb-1 flex items-center justify-center", compact ? "h-8" : "h-5")}>
        <p className={cn("text-center font-bold tracking-wide text-white", compact ? "line-clamp-2 text-[11px]" : "text-[11px] uppercase")}>
          {stageLabel}
        </p>
      </div>
      {stageName && (
        <div className="mb-1 flex h-8 items-start justify-center">
          <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white">{stageName}</p>
        </div>
      )}

      <div className="relative mx-auto" style={{ width: cardWidth, height: pileHeight }}>
        {hiddenLayers > 0 &&
          Array.from({ length: hiddenLayers }).map((_, layerIndex) => (
            <span
              key={`back-${stageId}-${layerIndex}`}
              aria-hidden
              className={cn(
                "absolute rounded-[7px] border shadow-[0_3px_8px_rgba(0,0,0,0.25)]",
                deckTone === "critical"
                  ? "border-rose-300/90 bg-[repeating-linear-gradient(145deg,rgba(127,29,29,0.55)_0px,rgba(127,29,29,0.55)_4px,rgba(255,241,242,0.95)_4px,rgba(255,241,242,0.95)_9px)]"
                  : "border-slate-300/90 bg-[repeating-linear-gradient(145deg,rgba(15,23,42,0.34)_0px,rgba(15,23,42,0.34)_4px,rgba(248,250,252,0.95)_4px,rgba(248,250,252,0.95)_9px)]"
              )}
              style={{
                width: cardWidth,
                height: cardHeight,
                top: layerIndex * 3,
                left: 0,
                zIndex: layerIndex + 1,
              }}
            />
          ))}

        {cards.map((lead, cardIndex) => (
          (() => {
            const isFrontCard = cardIndex === cards.length - 1
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => onSelect(lead.id)}
                className={cn(
                  "absolute overflow-hidden rounded-[7px] border bg-white px-1.5 py-1.5 text-center shadow-[0_4px_10px_rgba(0,0,0,0.26)]",
                  getLeadProblemState(lead) === "critical" ? "border-rose-300" : "border-slate-300",
                  activeLeadId === lead.id && "ring-2 ring-slate-300"
                )}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  top: hiddenLayers * 3 + 4 + cardIndex * cardStep,
                  left: 0,
                  zIndex: 20 + cardIndex,
                }}
              >
                <span className="absolute left-1 right-1 top-1 rounded-[4px] border border-slate-200/80 bg-white/95 px-1 py-0.5 text-[12px] font-bold leading-none text-slate-900">
                  <span className="block truncate">{lead.name ?? lead.id}</span>
                </span>
                <p
                  className={cn(
                    "mt-8 text-[16px] font-bold leading-tight text-slate-900",
                    isFrontCard ? "line-clamp-3 whitespace-normal break-words" : "line-clamp-2"
                  )}
                >
                  {lead.name ?? lead.id}
                </p>
              </button>
            )
          })()
        ))}

        {leads.length === 0 && (
          <span
            className="absolute rounded-[7px] border border-dashed border-white/35 bg-white/10"
            style={{ width: cardWidth, height: cardHeight, top: 0, left: 0 }}
          />
        )}
      </div>
    </>
  )
}
