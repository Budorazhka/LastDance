"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, Filter, Search, UserCheck, X, Eye } from "lucide-react"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import "./leads-secret-table.css"

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
  const y = 14 - arc * 14
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
          className="v2-table-dialog !fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !m-0 !h-screen !w-screen !max-w-none !rounded-none !border-0 !p-0 overflow-hidden flex flex-col"
        >
          <div className="v2-table-root">
            <div className="v2-table-bg" aria-hidden />
            <div className="v2-table-ornament" aria-hidden />

            <DialogHeader className="v2-table-hud !flex-row !flex-nowrap !gap-2 !text-left sm:!text-left">
              <DialogTitle className="sr-only">Карточный стол лидов v2</DialogTitle>
              <DialogDescription className="sr-only">Blackjack расклад лидов</DialogDescription>

              <Label className="shrink-0 text-[10px] uppercase tracking-wide text-[#f2dfb6]">Менеджер</Label>
              <Select value={selectedManagerId} onValueChange={onSelectedManagerIdChange}>
                <SelectTrigger className="h-7 w-[150px] shrink-0 border-[rgba(238,204,141,0.28)] bg-[rgba(22,15,8,0.75)] px-2 text-[11px] text-[#fff1cb] focus:ring-[rgba(152,219,252,0.3)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[rgba(239,205,142,0.24)] bg-[rgba(24,17,10,0.98)] text-[#f7e8c6]">
                    <SelectItem value="_all">Вся сеть</SelectItem>
                    {leadManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="_unassigned">Не назначен</SelectItem>
                  </SelectContent>
              </Select>

              <Label className="shrink-0 text-[10px] uppercase tracking-wide text-[#f2dfb6]">Дата</Label>
              <div className="flex shrink-0 items-center gap-1">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-7 w-[112px] border-[rgba(238,204,141,0.28)] bg-[rgba(22,15,8,0.75)] px-1.5 text-[11px] text-[#fff1cb] [color-scheme:dark]"
                />
                <span className="text-[10px] text-[#f2dfb6]">—</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-7 w-[112px] border-[rgba(238,204,141,0.28)] bg-[rgba(22,15,8,0.75)] px-1.5 text-[11px] text-[#fff1cb] [color-scheme:dark]"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 gap-1 border-[rgba(241,208,146,0.28)] bg-[rgba(51,35,18,0.66)] px-1.5 text-[11px] text-[rgba(247,232,198,0.86)] hover:bg-[rgba(88,57,25,0.74)]"
                  >
                    <Filter className="size-3" />
                    Фильтры
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  sideOffset={6}
                  className="min-w-[190px] border-[rgba(239,205,142,0.24)] bg-[rgba(24,17,10,0.98)] text-[#f7e8c6] z-[100]"
                >
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-[rgba(249,230,190,0.95)]">
                    Показать
                  </DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filterNoTask}
                    onCheckedChange={(v) => setFilterNoTask(v === true)}
                    className="text-sm focus:bg-[rgba(77,53,24,0.45)] focus:text-[#f7e8c6]"
                  >
                    Без задач
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterNoManager}
                    onCheckedChange={(v) => setFilterNoManager(v === true)}
                    className="text-sm focus:bg-[rgba(77,53,24,0.45)] focus:text-[#f7e8c6]"
                  >
                    Без менеджера
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterOverdue}
                    onCheckedChange={(v) => setFilterOverdue(v === true)}
                    className="text-sm focus:bg-[rgba(77,53,24,0.45)] focus:text-[#f7e8c6]"
                  >
                    Просрочка по задаче
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator className="border-[rgba(242,207,141,0.2)]" />
                  <DropdownMenuCheckboxItem
                    checked={showStats}
                    onCheckedChange={(v) => setShowStats(v === true)}
                    className="text-sm focus:bg-[rgba(77,53,24,0.45)] focus:text-[#f7e8c6]"
                  >
                    Показать общую статистику
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={onlyCritical ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyCritical((v) => !v)}
                className={cn(
                  "h-7 shrink-0 gap-1 px-1.5 text-[11px] whitespace-nowrap",
                  onlyCritical
                    ? "border-rose-300 bg-rose-600 text-white hover:bg-rose-700"
                    : "border-[rgba(237,204,139,0.3)] bg-[rgba(61,39,18,0.62)] text-[rgba(251,236,201,0.9)] hover:bg-[rgba(88,57,25,0.74)]"
                )}
              >
                <AlertTriangle className="size-3" />
                Только проблемные
              </Button>

              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-[rgba(241,225,189,0.66)]" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Поиск по имени"
                  className="h-7 w-full min-w-0 border-[rgba(238,204,141,0.28)] bg-[rgba(22,15,8,0.75)] pl-7 text-[11px] text-[#fff1cb] placeholder:text-[rgba(243,224,189,0.56)]"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="v2-close-btn ml-auto h-7 shrink-0 gap-1 px-2 text-[11px] font-medium"
              >
                <X className="size-3" />
                Закрыть
              </Button>
            </DialogHeader>

          <div className="relative z-10 min-h-0 flex-1 overflow-auto">
            <div
              className="relative mx-auto h-full min-h-[780px] min-w-[1460px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <div className="absolute left-8 right-8 top-0 h-[405px]">
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
                        stageLabel={stage.name}
                        stageName={undefined}
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

              <div className="absolute left-1/2 top-[56%] h-[360px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-[rgba(243,209,139,0.44)] pointer-events-none shadow-[inset_0_0_0_1px_rgba(254,235,186,0.13),0_0_26px_rgba(232,192,122,0.08)]">
                <div className="absolute inset-[20px] rounded-[50%] border border-[rgba(245,224,176,0.16)] border-dashed" />
              </div>

              <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-full max-w-[400px]">
                {!showStats ? (
                  <div
                    className="w-full flex flex-col justify-center text-[#fff4d7] [text-shadow:_0_2px_8px_rgba(0,0,0,0.75),_0_1px_2px_rgba(0,0,0,0.9)]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <div className="flex w-full items-center justify-between gap-3 mb-1.5">
                      <p className="text-[12px] font-extrabold uppercase tracking-widest text-[rgba(243,225,188,0.85)]">
                        Расклад
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryOpen(true)}
                        className="h-6 px-3 text-[10px] font-bold tracking-wide rounded-full border border-[rgba(244,211,147,0.4)] bg-[rgba(68,43,18,0.78)] text-[#fcecc8] hover:bg-[rgba(88,57,25,0.88)] hover:text-[#fff4d7] shadow-[inset_0_1px_0_rgba(255,235,190,0.18)]"
                      >
                        История
                      </Button>
                    </div>
                    <p className="mb-3 text-[10px] font-medium text-[rgba(239,224,192,0.88)] w-full text-left">
                      От: {createdLabel}
                    </p>

                    <div className="w-full flex flex-col items-center mb-3">
                      <p className="line-clamp-2 text-center text-[22px] font-black leading-tight text-white mb-0.5">
                        {activeLead?.name ?? "—"}
                      </p>
                      <p className="line-clamp-1 text-center text-[13px] font-semibold text-[#e7fff2]">
                        {activeStage?.name ?? "Нет этапа"}
                      </p>
                    </div>

                    <div className="w-full grid grid-cols-3 gap-3 mb-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 cursor-help">
                            <CheckCircle2 className={cn("size-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]", taskOk ? "text-[#9bf2ce]" : "text-rose-400")} />
                            <span className="text-[9px] uppercase tracking-widest text-[rgba(243,225,188,0.85)] mt-0.5">Задача</span>
                            <span className={cn("text-[13px] font-black leading-none", taskOk ? "text-[#c8f0d8]" : "text-rose-300")}>
                              {taskOk ? "Да" : "Нет"}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6} className="text-sm font-medium">Задача</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 cursor-help">
                            <UserCheck className={cn("size-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]", managerOk ? "text-[#9bf2ce]" : "text-rose-400")} />
                            <span className="text-[9px] uppercase tracking-widest text-[rgba(243,225,188,0.85)] mt-0.5">Менеджер</span>
                            <span className={cn("text-[13px] font-black leading-none", managerOk ? "text-[#c8f0d8]" : "text-rose-300")}>
                              {managerOk ? "Да" : "Нет"}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6} className="text-sm font-medium">
                          Менеджер: {activeLead ? managerLabel(activeLead.managerId, managerNameById) : "—"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 cursor-help">
                            <Clock className={cn("size-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]", overdue ? "text-rose-400" : "text-[#9bf2ce]")} />
                            <span className="text-[9px] uppercase tracking-widest text-[rgba(243,225,188,0.85)] mt-0.5">Проср.</span>
                            <span className={cn("text-[13px] font-black leading-none", overdue ? "text-rose-300" : "text-[#c8f0d8]")}>
                              {overdue ? "Да" : "Нет"}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6} className="text-sm font-medium">Просрочка по задаче</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="w-full flex items-center justify-between border-t border-[rgba(243,209,139,0.25)] pt-2.5">
                      <div className="text-left">
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[rgba(243,225,188,0.85)] mb-0.5">Прогресс</p>
                        <p className="text-[13px] font-bold leading-none text-[#fff0cb]">{activityLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[rgba(243,225,188,0.85)] mb-0.5">Комиссия</p>
                        <p className="text-[16px] font-bold leading-none text-[#ffe4a8]">{formatUsd(activeLeadCommission)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-[12px] border border-[rgba(242,210,146,0.35)] bg-[rgba(18,45,36,0.96)] px-6 py-4 text-[#f2e4c1] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    <p className="col-span-2 mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-[rgba(249,230,190,0.95)]">
                      Количество по всем этапам
                    </p>
                    <div className="text-center">
                      <p className="mb-0.5 text-[11px] uppercase tracking-widest text-[rgba(249,230,190,0.9)]">Всего лидов</p>
                      <p className="text-[24px] font-black leading-none text-white">{totals.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="mb-0.5 text-[11px] uppercase tracking-widest text-rose-200/80">Проблемные</p>
                      <p className="text-[24px] font-black leading-none text-rose-200">{totals.critical}</p>
                    </div>
                    <div className="text-center">
                      <p className="mb-0.5 text-[11px] uppercase tracking-widest text-[rgba(249,230,190,0.9)]">Доля проблемных</p>
                      <p className="text-[24px] font-black leading-none text-[#ffeab4]">
                        {totals.total > 0 ? Math.round((totals.critical / totals.total) * 100) : 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-0.5 text-[11px] uppercase tracking-widest text-[rgba(249,230,190,0.9)]">Комиссия</p>
                      <p className="text-[24px] font-black leading-none text-[#c8f0d8]">
                        {formatUsd(totals.totalCommission)}
                      </p>
                    </div>
                    <div className="col-span-2 pt-1 text-center border-t border-[rgba(243,209,139,0.25)] mt-1">
                      <p className="mb-0.5 text-[11px] uppercase tracking-widest text-rose-200/80">Комиссия по проблемным</p>
                      <p className="text-[20px] font-black leading-none text-rose-200">
                        {formatUsd(totals.criticalCommission)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-10 left-10 flex items-end gap-5">
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

              <div className="absolute bottom-10 right-10 flex items-end gap-5">
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
                <div className="v2-dealer-block flex h-[66px] min-w-[208px] items-center gap-2 px-3 py-2">
                  <span className="v2-dealer-avatar">
                    {managerInitials(dealerName || "MN")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgba(247,229,189,0.82)]">Менеджер</p>
                    <p className="truncate text-[16px] font-semibold leading-tight text-[#ffefca]">{dealerName}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog >

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

  const cardWidth = compact ? 76 : 95
  const cardHeight = compact ? 114 : 142
  const cardStep = compact ? 22 : 27
  const pileHeight = hiddenLayers * (compact ? 2 : 3) + 4 + cardHeight + (compact ? 6 : 8)

  const columnId = LEAD_STAGE_COLUMN[stageId] ?? "in_progress"
  const [showLocalStats, setShowLocalStats] = useState(false)

  return (
    <>
      <div>
        {!compact && (
          <div className="mb-1 flex justify-center">
            <button
              onClick={() => setShowLocalStats((v) => !v)}
              className="text-[rgba(247,232,198,0.6)] hover:text-[#f7ecd4] transition-colors focus:outline-none"
              title="Показать статистику по этапу"
            >
              <Eye className="size-4" />
            </button>
          </div>
        )}

        <div className="mb-3 flex h-6 items-center justify-center gap-1.5">
          {showControls ? (
            <>
              <button
                type="button"
                onClick={() => onStep(stageId, leads, -1)}
                className="v2-stage-nav-btn h-5 min-w-[32px] px-1 text-[11px]"
              >
                &#8249;&#8249;
              </button>
              <button
                type="button"
                onClick={() => onStep(stageId, leads, 1)}
                className="v2-stage-nav-btn h-5 min-w-[32px] px-1 text-[11px]"
              >
                &#8250;&#8250;
              </button>
            </>
          ) : (
            <>
              <span className="h-5 min-w-[32px] opacity-0">&#8249;&#8249;</span>
              <span className="h-5 min-w-[32px] opacity-0">&#8250;&#8250;</span>
            </>
          )}
        </div>

        <div className={cn("mb-2 flex items-center justify-center", compact ? "h-8" : "h-5")}>
          <p className={cn("text-center font-bold tracking-wide text-[#f2dfb6]", compact ? "line-clamp-2 text-[11px]" : "text-[11px] uppercase")}>
            {stageLabel}
          </p>
        </div>

        {!compact && (showStats || showLocalStats) && (
          <div className="mb-1 flex flex-col items-center gap-0.5 [text-shadow:_0_1px_3px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 text-[11px] font-semibold leading-none text-[#f7ecd4]">
              <span>Всего: {totalLeads}</span>
              <span className="text-rose-300">Пробл: {criticalLeads}</span>
            </div>
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold leading-none",
              criticalLeads / Math.max(totalLeads, 1) > 0.5
                ? "bg-rose-600 text-white"
                : criticalLeads / Math.max(totalLeads, 1) > 0.25
                  ? "bg-[rgba(88,57,25,0.88)] text-[#fcecc8] border border-[rgba(244,214,150,0.55)]"
                  : "bg-[rgba(24,106,78,0.84)] text-[#e7ffef] border border-[rgba(150,255,217,0.62)]"
            )}>
              {totalLeads > 0 ? Math.round((criticalLeads / totalLeads) * 100) : 0}% пробл.
            </span>
          </div>
        )}

        {stageName && (
          <div className="flex h-8 items-start justify-center">
            <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[#f2dfb6]">
              {stageName}
            </p>
          </div>
        )}
      </div>
      <div className="mb-4" />

      <div className="relative mx-auto" style={{ width: cardWidth, height: pileHeight }}>
        {hiddenLayers > 0 &&
          Array.from({ length: hiddenLayers }).map((_, layerIndex) => (
            <span
              key={`back-${stageId}-${layerIndex}`}
              aria-hidden
              className={cn(
                "absolute shadow-[0_3px_8px_rgba(0,0,0,0.25)]",
                compact ? "rounded-[11px]" : "rounded-[14px]",
                "v2-card-back",
                deckTone === "critical" && "border-rose-300/90"
              )}
              style={{
                width: cardWidth,
                height: cardHeight,
                top: layerIndex * (compact ? 2 : 3),
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
                  "absolute overflow-hidden px-1.5 py-1.5 text-center shadow-[0_4px_10px_rgba(0,0,0,0.26)] v2-card-face",
                  compact ? "rounded-[11px]" : "rounded-[14px]",
                  isCritical && "is-critical",
                  activeLeadId === lead.id && "ring-2 ring-[rgba(243,209,139,0.6)]"
                )}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  top: hiddenLayers * (compact ? 2 : 3) + 4 + cardIndex * cardStep,
                  left: 0,
                  zIndex: 20 + cardIndex,
                  animationName: "dealCard",
                  animationDuration: "420ms",
                  animationDelay: `${delayMs}ms`,
                  animationTimingFunction: "cubic-bezier(0.18, 0.89, 0.32, 1.28)",
                  animationFillMode: "backwards",
                }}
              >
                {isCritical && (
                  <span
                    aria-hidden
                    className={cn("pointer-events-none absolute inset-0", compact ? "rounded-[11px]" : "rounded-[14px]")}
                    style={{
                      background: "repeating-linear-gradient(145deg,rgba(251,113,133,0.09) 0px,rgba(251,113,133,0.09) 3px,transparent 3px,transparent 16px)",
                      zIndex: 0,
                    }}
                  />
                )}
                {!isFrontCard && (
                  <span className="relative z-10 absolute left-1 right-1 top-1 rounded-[4px] border border-[rgba(217,201,171,0.5)] bg-[#f8f4ec]/95 px-1 py-0.5 text-[10px] font-medium leading-none text-[#2a2318]">
                    <span className="block truncate">{lead.name ?? lead.id}</span>
                  </span>
                )}
                <p
                  className={cn(
                    "relative z-10 font-medium leading-tight text-[#2a2318]",
                    compact ? "mt-2 text-[11px]" : "mt-4 text-[13px]",
                    isFrontCard ? "line-clamp-3 whitespace-normal break-words" : "line-clamp-2"
                  )}
                >
                  {lead.name ?? lead.id}
                </p>
                {columnId === "in_progress" && lead.commissionUsd != null && (
                  <p className={cn("relative z-10 font-medium text-[#6b5e4e]", compact ? "mt-0.5 text-[9px]" : "mt-1 text-[10px]")}>
                    {formatUsd(lead.commissionUsd)}
                  </p>
                )}
              </button>
            )
          })()
        ))}

        {leads.length === 0 && (
          <span
            className={cn("v2-card-back absolute border border-dashed border-[rgba(238,209,152,0.4)] opacity-60", compact ? "rounded-[11px]" : "rounded-[14px]")}
            style={{ width: cardWidth, height: cardHeight, top: 0, left: 0 }}
          />
        )}
      </div>

      {!compact && (showStats || showLocalStats) && columnCommission > 0 && (
        <div className="mt-0.5 text-center text-[13px] font-bold leading-none text-[#fcecc8] [text-shadow:_0_1px_3px_rgba(0,0,0,0.75)]">
          {formatUsd(columnCommission)}
        </div>
      )}
    </>
  )
}
