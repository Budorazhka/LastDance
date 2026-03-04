"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Filter, Search, UserCheck, X } from "lucide-react"
import { useLeads } from "@/context/LeadsContext"
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
  if (!lead.managerId || lead.hasTask === false || lead.taskOverdue) return "critical"
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

function formatUsd(amount?: number | null): string {
  if (!amount || amount <= 0) return "—"
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function visibleLeadCards(leads: Lead[], cursor: number): Lead[] {
  if (leads.length === 0) return []
  const index = cursor % leads.length
  return [leads[index]]
}

export function LeadsCardTableV2Dialog({
  open,
  onOpenChange,
  selectedManagerId,
  onSelectedManagerIdChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedManagerId: string
  onSelectedManagerIdChange: (id: string) => void
}) {
  const { state } = useLeads()
  const { leadPool, leadManagers } = state
  const [cursorByStageId, setCursorByStageId] = useState<Record<string, number>>({})
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [filterNoTask, setFilterNoTask] = useState(false)
  const [filterNoManager, setFilterNoManager] = useState(false)
  const [filterOverdue, setFilterOverdue] = useState(false)
  const [onlyCritical, setOnlyCritical] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [dealSession, setDealSession] = useState(0)

  useEffect(() => {
    if (open) {
      setDealSession((s) => s + 1)
    }
  }, [open])

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

    if (filterNoTask || filterNoManager || filterOverdue) {
      list = list.filter((lead) => {
        const noTask = lead.hasTask === false
        const noManager = !lead.managerId
        const overdue = lead.taskOverdue === true

        const conditions: boolean[] = []
        if (filterNoTask) conditions.push(noTask)
        if (filterNoManager) conditions.push(noManager)
        if (filterOverdue) conditions.push(overdue)

        return conditions.some(Boolean)
      })
    }

    if (onlyCritical) {
      list = list.filter((lead) => getLeadProblemState(lead) === "critical")
    }

    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null
      if (toDate) {
        toDate.setHours(23, 59, 59, 999)
      }
      list = list.filter((lead) => {
        const created = new Date(lead.createdAt)
        if (Number.isNaN(created.getTime())) return true
        if (fromDate && created < fromDate) return false
        if (toDate && created > toDate) return false
        return true
      })
    }

    return list
  }, [leadPool, selectedManagerId, q, filterNoTask, filterNoManager, filterOverdue, onlyCritical, dateFrom, dateTo])

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
    const overdue = filteredLeads.filter((lead) => lead.taskOverdue).length
    const healthy = Math.max(0, filteredLeads.length - critical)
    const totalCommission = filteredLeads.reduce((sum, lead) => sum + (lead.commissionUsd ?? 0), 0)
    const criticalCommission = filteredLeads.reduce(
      (sum, lead) =>
        sum + (getLeadProblemState(lead) === "critical" ? (lead.commissionUsd ?? 0) : 0),
      0
    )
    return {
      total: filteredLeads.length,
      critical,
      healthy,
      rejection,
      overdue,
      totalCommission,
      criticalCommission,
    }
  }, [filteredLeads])

  const dealerName =
    selectedManagerId === "_all"
      ? "Менеджеры: вся сеть"
      : selectedManagerId === "_unassigned"
        ? "Не назначен"
        : leadManagers.find((manager) => manager.id === selectedManagerId)?.name ?? selectedManagerId

  const dealOrderByLeadId = useMemo(() => {
    const order: Record<string, number> = {}
    let idx = 0

    const addStages = (stages: typeof IN_PROGRESS_STAGES) => {
      stages.forEach((stage) => {
        const leads = leadsByStage[stage.id] ?? []
        const cursor = cursorByStageId[stage.id] ?? 0
        const [front] = visibleLeadCards(leads, cursor)
        if (front) {
          order[front.id] = idx++
        }
      })
    }

    addStages(IN_PROGRESS_STAGES)
    addStages(REJECTION_STAGES)
    addStages(SUCCESS_STAGES)

    return order
  }, [leadsByStage, cursorByStageId])

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
  const createdLabel = activeLead
    ? new Date(activeLead.createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—"
  const taskOk = activeLead ? activeLead.hasTask !== false : false
  const managerOk = activeLead ? Boolean(activeLead.managerId) : false
  const overdue = activeLead ? activeLead.taskOverdue === true : false

  const activeLeadCommission = activeLead?.commissionUsd ?? null

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
    <>
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

            <Label className="ml-2 text-[11px] uppercase tracking-wide text-emerald-100">Дата</Label>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-7 w-[130px] border-emerald-500 bg-emerald-900/35 px-2 text-xs text-white [color-scheme:dark]"
              />
              <span className="text-[11px] text-emerald-100">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-7 w-[130px] border-emerald-500 bg-emerald-900/35 px-2 text-xs text-white [color-scheme:dark]"
              />
            </div>

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
                <DropdownMenuCheckboxItem
                  checked={filterOverdue}
                  onCheckedChange={(v) => setFilterOverdue(v === true)}
                  className="text-sm focus:bg-emerald-700 focus:text-white"
                >
                  Просрочка по задаче
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats((v) => !v)}
              className="h-7 gap-1 border-emerald-300/55 bg-emerald-900/40 px-2 text-xs text-emerald-50 hover:bg-emerald-700/70"
            >
              <BarChart3 className="size-3.5" />
              Статистика
            </Button>

            <Button
              variant={onlyCritical ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyCritical((v) => !v)}
              className={cn(
                "h-7 gap-1 px-2 text-xs",
                onlyCritical
                  ? "border-rose-300 bg-rose-600 text-white hover:bg-rose-700"
                  : "border-rose-300/70 bg-rose-900/30 text-rose-50 hover:bg-rose-800/60"
              )}
            >
              <AlertTriangle className="size-3.5" />
              Только проблемные
            </Button>

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
            className="relative mx-auto h-full min-h-[780px] min-w-[1460px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <div className="absolute left-8 right-[310px] top-4 h-[405px]">
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
                      showStats={showStats}
                      dealOrderByLeadId={dealOrderByLeadId}
                      dealSession={dealSession}
                    />
                  </div>
                )
              })}
            </div>

            {showStats && totals.totalCommission > 0 && (
              <div className="absolute left-1/2 top-[46%] -translate-x-1/2 text-[18px] font-bold leading-none text-emerald-100 [text-shadow:_0_2px_6px_rgba(0,0,0,0.85)]">
                Комиссия по всем этапам: {formatUsd(totals.totalCommission)}
              </div>
            )}

            <div className="absolute left-1/2 top-[60%] h-[308px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-amber-300/90">
              <div className="absolute inset-[20px] rounded-[50%] border border-amber-200/85" />
              <div className="absolute inset-0 flex items-center justify-center">
                {!showStats ? (
                  <div
                    className="space-y-1.5 text-center text-[22px] leading-tight text-white [text-shadow:_0_2px_8px_rgba(0,0,0,0.75),_0_1px_2px_rgba(0,0,0,0.9)]"
                    style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="cursor-help">Активные лиды: {centerBrief.inProgress}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                        Сумма лидов на всех этапах «В работе» в текущей выборке.
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="cursor-help">Проблемные: {totals.critical}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                        Лиды без менеджера, без задачи, с просрочкой или на отказных этапах.
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="cursor-help">
                          Узкое место: {centerBrief.bottleneckName} ({centerBrief.bottleneckCount})
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                        Этап с максимальным числом лидов среди «В работе».
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="cursor-help">Следующий шаг: {centerBrief.focusShort}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[360px] leading-relaxed">
                        Автоматическая рекомендация по текущей выборке.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-x-10 gap-y-2 text-white [text-shadow:_0_2px_8px_rgba(0,0,0,0.75),_0_1px_2px_rgba(0,0,0,0.9)]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-widest text-emerald-200/80">Всего лидов</p>
                      <p className="text-[32px] font-bold leading-none text-white">{totals.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-widest text-rose-200/80">Проблемные</p>
                      <p className="text-[32px] font-bold leading-none text-rose-200">{totals.critical}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-widest text-amber-200/80">Доля проблемных</p>
                      <p className="text-[32px] font-bold leading-none text-amber-200">
                        {totals.total > 0 ? Math.round((totals.critical / totals.total) * 100) : 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-widest text-emerald-200/80">Комиссия</p>
                      <p className="text-[32px] font-bold leading-none text-emerald-100">
                        {formatUsd(totals.totalCommission)}
                      </p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-[11px] uppercase tracking-widest text-rose-200/80">Комиссия по проблемным</p>
                      <p className="text-[28px] font-bold leading-none text-rose-200">
                        {formatUsd(totals.criticalCommission)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-14 left-8 flex items-end gap-2">
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
                      showStats={showStats}
                      compact
                      dealOrderByLeadId={dealOrderByLeadId}
                      dealSession={dealSession}
                    />
                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-20 right-6 flex items-end gap-2">
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
                      showStats={showStats}
                      compact
                      dealOrderByLeadId={dealOrderByLeadId}
                      dealSession={dealSession}
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold uppercase leading-none tracking-wide text-slate-500">
                  РАСКЛАД
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="h-6 px-2.5 text-[11px] font-extrabold tracking-wide rounded-full border-2 border-rose-700 bg-white text-rose-800 hover:bg-rose-600 hover:text-white hover:border-rose-800 shadow-[0_0_0_1px_rgba(255,255,255,0.9),0_6px_16px_rgба(0,0,0,0.75)]"
                >
                  История отношений
                </Button>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-600">
                Дата создания: {createdLabel}
              </p>
              <div className="mt-3 rounded-[14px] border-2 border-indigo-200 bg-slate-100 px-3 py-3 text-center">
                <p className="line-clamp-2 text-[18px] font-bold leading-tight text-slate-800">
                  {activeLead?.name ?? "—"}
                </p>
                <p className="mt-1 line-clamp-1 text-[14px] font-semibold text-slate-500">
                  {activeStage?.name ?? "Нет этапа"}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex flex-col items-center gap-1 rounded-[10px] border-2 px-2 py-2 cursor-help",
                      taskOk ? "border-emerald-400 bg-emerald-50/40" : "border-rose-400 bg-rose-50/60"
                    )}>
                      <CheckCircle2 className={cn("size-4", taskOk ? "text-emerald-600" : "text-rose-500")} />
                      <span className={cn("text-[13px] font-bold leading-none", taskOk ? "text-emerald-700" : "text-rose-700")}>
                        {taskOk ? "Да" : "Нет"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} className="text-sm">Задача</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex flex-col items-center gap-1 rounded-[10px] border-2 px-2 py-2 cursor-help",
                      managerOk ? "border-emerald-400 bg-emerald-50/40" : "border-rose-400 bg-rose-50/60"
                    )}>
                      <UserCheck className={cn("size-4", managerOk ? "text-emerald-600" : "text-rose-500")} />
                      <span className={cn("text-[13px] font-bold leading-none", managerOk ? "text-emerald-700" : "text-rose-700")}>
                        {managerOk ? "Да" : "Нет"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} className="text-sm">
                    Менеджер: {activeLead ? managerLabel(activeLead.managerId, managerNameById) : "—"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex flex-col items-center gap-1 rounded-[10px] border-2 px-2 py-2 cursor-help",
                      overdue ? "border-rose-400 bg-rose-50/60" : "border-emerald-400 bg-emerald-50/40"
                    )}>
                      <Clock className={cn("size-4", overdue ? "text-rose-500" : "text-emerald-600")} />
                      <span className={cn("text-[13px] font-bold leading-none", overdue ? "text-rose-700" : "text-emerald-700")}>
                        {overdue ? "Да" : "Нет"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} className="text-sm">Просрочка по задаче</TooltipContent>
                </Tooltip>
              </div>

              <div className="mt-2 flex items-baseline justify-between rounded-[10px] border border-indigo-100 bg-slate-100 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Прогресс</p>
                <p className="text-[15px] font-bold leading-none text-slate-800">{activityLabel}</p>
              </div>

              <div className="mt-2 flex items-baseline justify-between rounded-[10px] border border-dashed border-slate-300/80 bg-slate-50/50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Комиссия</p>
                <p className="text-[15px] font-bold leading-none text-slate-800">{formatUsd(activeLeadCommission)}</p>
              </div>
            </aside>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl h-[50vh] max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>История отношений</DialogTitle>
            <DialogDescription>
              Раздел в разработке. Здесь появится хронология контактов по лиду.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 rounded-md border border-dashed border-slate-300/80 bg-slate-50/80" />
        </DialogContent>
      </Dialog>
    </>
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
  showStats,
  compact = false,
  dealOrderByLeadId = {},
  dealSession = 0,
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
  showStats: boolean
  dealOrderByLeadId?: Record<string, number>
  dealSession?: number
  compact?: boolean
}) {
  const cards = visibleLeadCards(leads, cursor)
  const hiddenCount = Math.max(0, leads.length - cards.length)
  const hiddenLayers = Math.min(compact ? 7 : 10, hiddenCount)
  const deckTone = getDeckVisualState(stageId, leads)

  const totalLeads = leads.length
  const criticalLeads = leads.filter((lead) => getLeadProblemState(lead) === "critical").length
  const columnCommission = leads.reduce((sum, lead) => sum + (lead.commissionUsd ?? 0), 0)

  const cardWidth = 95
  const cardHeight = 142
  const cardStep = 27
  const pileHeight = hiddenLayers * 3 + 4 + cardHeight + 8

  const columnId = LEAD_STAGE_COLUMN[stageId] ?? "in_progress"
  const arrowColorClasses =
    columnId === "rejection"
      ? "border-sky-300 bg-sky-600"
      : columnId === "success"
        ? "border-amber-300 bg-amber-500"
        : "border-emerald-300 bg-emerald-600"

  return (
    <>
      <div className="mb-1 flex h-6 items-center justify-center gap-1.5">
        {showControls ? (
          <>
            <button
              type="button"
              onClick={() => onStep(stageId, leads, -1)}
              className={cn(
                "h-5 min-w-[32px] rounded border px-1 text-[11px] font-bold text-white",
                arrowColorClasses
              )}
            >
              ◂♦
            </button>
            <button
              type="button"
              onClick={() => onStep(stageId, leads, 1)}
              className={cn(
                "h-5 min-w-[32px] rounded border px-1 text-[11px] font-bold text-white",
                arrowColorClasses
              )}
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

      <div className={cn("mb-0.5 flex items-center justify-center", compact ? "h-8" : "h-5")}>
        <p className={cn("text-center font-bold tracking-wide text-white", compact ? "line-clamp-2 text-[11px]" : "text-[11px] uppercase")}>
          {stageLabel}
        </p>
      </div>

      {!compact && showStats && (
        <div className="mb-1 flex flex-col items-center gap-0.5 [text-shadow:_0_1px_3px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold leading-none text-white">
            <span className="text-white">Всего: {totalLeads}</span>
            <span className="text-rose-300">Пробл: {criticalLeads}</span>
          </div>
          <span className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-bold leading-none",
            criticalLeads / Math.max(totalLeads, 1) > 0.5
              ? "bg-rose-600 text-white"
              : criticalLeads / Math.max(totalLeads, 1) > 0.25
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white"
          )}>
            {totalLeads > 0 ? Math.round((criticalLeads / totalLeads) * 100) : 0}% пробл.
          </span>
        </div>
      )}

      {stageName && (
        <div className="mb-1 flex h-8 items-start justify-center">
          <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white">
            {stageName}
          </p>
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
            const isCritical = getLeadProblemState(lead) === "critical"
            const dealIndex = dealOrderByLeadId[lead.id] ?? 0
            const delayMs = dealIndex * 70
            return (
              <button
                key={lead.id + "-" + dealSession}
                type="button"
                onClick={() => onSelect(lead.id)}
                className={cn(
                  "absolute overflow-hidden rounded-[7px] border px-1.5 py-1.5 text-center shadow-[0_4px_10px_rgba(0,0,0,0.26)]",
                  isCritical ? "border-rose-300 bg-[#FDF2F2]" : "border-slate-300 bg-white",
                  activeLeadId === lead.id && "ring-2 ring-slate-300"
                )}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  top: hiddenLayers * 3 + 4 + cardIndex * cardStep,
                  left: 0,
                  zIndex: 20 + cardIndex,
                  animationName: "dealCard",
                  animationDuration: "420ms",
                  animationDelay: `${delayMs}ms`,
                  animationTimingFunction: "cubic-bezier(0.18, 0.89, 0.32, 1.28)",
                  animationFillMode: "backwards",
                }}
              >
                {!isFrontCard && (
                  <span className="absolute left-1 right-1 top-1 rounded-[4px] border border-slate-200/80 bg-white/95 px-1 py-0.5 text-[11.5px] font-bold leading-none text-slate-900">
                    <span className="block truncate">{lead.name ?? lead.id}</span>
                  </span>
                )}
                <p
                  className={cn(
                    "mt-8 text-[15.5px] font-bold leading-tight text-slate-900",
                    isFrontCard ? "line-clamp-3 whitespace-normal break-words" : "line-clamp-2"
                  )}
                >
                  {lead.name ?? lead.id}
                </p>
                {columnId === "in_progress" && lead.commissionUsd != null && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    {formatUsd(lead.commissionUsd)}
                  </p>
                )}
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

      {!compact && showStats && columnCommission > 0 && (
        <div className="mt-0.5 text-center text-[13px] font-bold leading-none text-emerald-200 [text-shadow:_0_1px_3px_rgba(0,0,0,0.75)]">
          {formatUsd(columnCommission)}
        </div>
      )}
    </>
  )
}
