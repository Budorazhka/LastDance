import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, GitBranch, Star, TrendingUp, Users, X } from "lucide-react"
import {
  ActivityCalendarCard,
  ActivityChart,
  ActivityComposition,
  ConversionOverviewChart,
  DynamicKpiCards,
  FunnelKanban,
  LeaderboardTable,
  LeadsChart,
  PartnersActivityDistribution,
  PeriodTabs,
  StaticKpiCards,
  TopReferralsChart,
} from "@/components/analytics-network"
import { CabinetSwitcher } from "@/components/analytics-network/cabinet-switcher"
import { AnalyticsNavLinks } from "@/components/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PersonalAnalyticsInsights } from "@/components/analytics-network/personal-analytics-insights"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getOwnerDashboardContext } from "@/lib/mock/owner-dashboard"
import {
  getAnalyticsData,
  getPeriodDateRange,
  getPersonAnalyticsData,
  getPartnerSummary,
} from "@/lib/mock/analytics-network"
import { cn } from "@/lib/utils"
import type {
  ActivityMarker,
  AnalyticsPeriod,
  DynamicKpi,
  FunnelBoard,
  PartnerRow,
  SortColumn,
  SortDirection,
  StaticKpi,
} from "@/types/analytics"
import type {
  OwnerCabinetOption,
  OwnerHierarchyNode,
} from "@/types/owner-dashboard"

const defaultSortColumn: SortColumn = "leadsAdded"
const defaultSortDirection: SortDirection = "desc"

type NormalizedAnalyticsData = {
  periodLabel: string
  staticKpi: StaticKpi
  dynamicKpi: DynamicKpi
  funnels: FunnelBoard[]
  partners: PartnerRow[]
  leadsTimeseries: { date: string; leads: number }[]
  activityTimeseries: { date: string; calls: number; chats: number; selections: number }[]
}

function getCabinetAnalyticsData(
  cabinet: OwnerCabinetOption | undefined,
  period: AnalyticsPeriod
): NormalizedAnalyticsData | null {
  if (!cabinet || cabinet.scope === "network") {
    const networkData = getAnalyticsData(period)
    return {
      periodLabel: networkData.periodLabel,
      staticKpi: networkData.staticKpi,
      dynamicKpi: networkData.dynamicKpi,
      funnels: networkData.funnels,
      partners: networkData.partners,
      leadsTimeseries: networkData.leadsTimeseries,
      activityTimeseries: networkData.activityTimeseries,
    }
  }

  if (!cabinet.personId) return null
  const personData = getPersonAnalyticsData(cabinet.personId, period)
  if (!personData) return null

  return {
    periodLabel: personData.periodLabel,
    staticKpi: personData.staticKpi,
    dynamicKpi: personData.dynamicKpi,
    funnels: personData.funnels,
    partners: personData.referrals,
    leadsTimeseries: personData.leadsTimeseries,
    activityTimeseries: personData.activityTimeseries,
  }
}

export function SupremeOwnerDashboardPage() {
  const navigate = useNavigate()
  const { cityId, partnerId } = useParams<{ cityId: string; partnerId: string }>()
  const ownerContext = useMemo(() => getOwnerDashboardContext(), [])
  const initialCabinetId =
    ownerContext.availableCabinets.find((cabinet) => cabinet.personId === partnerId)?.id ??
    ownerContext.availableCabinets[0]?.id ??
    "network"
  const [selectedCabinetId, setSelectedCabinetId] = useState(
    initialCabinetId
  )

  const [globalPeriod, setGlobalPeriod] = useState<AnalyticsPeriod>("week")
  const [leadsPeriod, setLeadsPeriod] = useState<AnalyticsPeriod>("week")
  const [activityPeriod, setActivityPeriod] = useState<AnalyticsPeriod>("week")
  const [topReferralsPeriod, setTopReferralsPeriod] =
    useState<AnalyticsPeriod>("week")
  const [engagementPeriod, setEngagementPeriod] = useState<AnalyticsPeriod>("week")

  const [sortColumn, setSortColumn] = useState<SortColumn>(defaultSortColumn)
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSortDirection
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [onlyOnline, setOnlyOnline] = useState(false)
  const [inactiveLast7, setInactiveLast7] = useState(false)
  const [selectedActivityMarker, setSelectedActivityMarker] =
    useState<ActivityMarker | null>(null)
  const [partnerListSearch, setPartnerListSearch] = useState("")
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set())
  const [allPartnersModalOpen, setAllPartnersModalOpen] = useState(false)
  const [hierarchyDialogOpen, setHierarchyDialogOpen] = useState(false)

  const selectedCabinet = useMemo(
    () =>
      ownerContext.availableCabinets.find(
        (cabinet) => cabinet.id === selectedCabinetId
      ) ?? ownerContext.availableCabinets[0],
    [ownerContext.availableCabinets, selectedCabinetId]
  )

  useEffect(() => {
    if (!partnerId) return
    const byRoute = ownerContext.availableCabinets.find((cabinet) => cabinet.personId === partnerId)
    if (byRoute && byRoute.id !== selectedCabinetId) {
      setSelectedCabinetId(byRoute.id)
    }
  }, [ownerContext.availableCabinets, partnerId, selectedCabinetId])

  const globalData = useMemo(
    () => getCabinetAnalyticsData(selectedCabinet, globalPeriod),
    [selectedCabinet, globalPeriod]
  )
  const todayData = useMemo(
    () => getCabinetAnalyticsData(selectedCabinet, "week"),
    [selectedCabinet]
  )
  const leadsData = useMemo(
    () =>
      getCabinetAnalyticsData(selectedCabinet, leadsPeriod)?.leadsTimeseries ?? [],
    [selectedCabinet, leadsPeriod]
  )
  const activityData = useMemo(
    () =>
      getCabinetAnalyticsData(selectedCabinet, activityPeriod)
        ?.activityTimeseries ?? [],
    [selectedCabinet, activityPeriod]
  )
  const monthCalendarData = useMemo(
    () =>
      getCabinetAnalyticsData(selectedCabinet, "month")?.activityTimeseries ?? [],
    [selectedCabinet]
  )
  const allTimeCalendarData = useMemo(
    () =>
      getCabinetAnalyticsData(selectedCabinet, "allTime")
        ?.activityTimeseries ?? [],
    [selectedCabinet]
  )
  const topReferralsPartners = useMemo(
    () =>
      getCabinetAnalyticsData(selectedCabinet, topReferralsPeriod)?.partners ?? [],
    [selectedCabinet, topReferralsPeriod]
  )
  const engagementPartners = useMemo(
    () =>
      getCabinetAnalyticsData(selectedCabinet, engagementPeriod)?.partners ?? [],
    [selectedCabinet, engagementPeriod]
  )

  const selectedActivityPartners = useMemo(
    () =>
      selectedActivityMarker
        ? engagementPartners.filter(
            (partner) => partner.activityMarker === selectedActivityMarker
          )
        : [],
    [engagementPartners, selectedActivityMarker]
  )

  const partnerListFiltered = useMemo(() => {
    if (!globalData) return []
    const q = partnerListSearch.trim().toLowerCase()
    const list = globalData.partners
    return q ? list.filter((p) => p.name.toLowerCase().includes(q)) : list
  }, [globalData, partnerListSearch])

  const range = useMemo(() => getPeriodDateRange(globalPeriod), [globalPeriod])
  const monthRangeForCalendar = useMemo(() => getPeriodDateRange("month"), [])
  const rangeLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("ru-RU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${formatter.format(range.start)} - ${formatter.format(range.end)}`
  }, [range])

  const filteredPartners = useMemo(() => {
    if (!globalData) return []
    const query = searchQuery.trim().toLowerCase()
    let partners = globalData.partners

    if (query) {
      partners = partners.filter((partner) =>
        partner.name.toLowerCase().includes(query)
      )
    }
    if (onlyOnline) {
      partners = partners.filter((partner) => partner.isOnline)
    }
    if (inactiveLast7) {
      partners = partners.filter((partner) => partner.onlineDaysLast7 === 0)
    }

    return partners
  }, [globalData, inactiveLast7, onlyOnline, searchQuery])

  const maxLeadsAdded = useMemo(
    () => Math.max(...filteredPartners.map((partner) => partner.leadsAdded), 1),
    [filteredPartners]
  )
  const maxStageChangesCount = useMemo(
    () =>
      Math.max(...filteredPartners.map((partner) => partner.stageChangesCount), 1),
    [filteredPartners]
  )
  const sortedPartners = useMemo(() => {
    return [...filteredPartners].sort((a, b) => {
      const diff = a[sortColumn] - b[sortColumn]
      if (diff !== 0) {
        return sortDirection === "asc" ? diff : -diff
      }
      return a.name.localeCompare(b.name, "ru", { sensitivity: "base" })
    })
  }, [filteredPartners, sortColumn, sortDirection])

  const level2ReferralsTotal = useMemo(
    () => sortedPartners.reduce((sum, partner) => sum + partner.level2Count, 0),
    [sortedPartners]
  )
  const salesFunnel = useMemo(
    () => globalData?.funnels.find((funnel) => funnel.id === "sales"),
    [globalData]
  )

  const handleSortChange = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }
    setSortColumn(column)
    setSortDirection("desc")
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setOnlyOnline(false)
    setInactiveLast7(false)
    setSortColumn(defaultSortColumn)
    setSortDirection(defaultSortDirection)
  }

  const handleSelectAllPartners = () => {
    const allPartnerIds = new Set(globalData?.partners.map(p => p.id) || [])
    setSelectedPartners(allPartnerIds)
  }

  const handleTogglePartnerSelection = (partnerId: string) => {
    setSelectedPartners(prev => {
      const next = new Set(prev)
      if (next.has(partnerId)) {
        next.delete(partnerId)
      } else {
        next.add(partnerId)
      }
      return next
    })
  }

  if (!globalData) {
    return (
      <div className="w-full space-y-4 px-3 py-4 sm:px-5">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-base font-medium">Кабинет недоступен</p>
            <p className="text-sm text-muted-foreground">
              Не удалось загрузить данные выбранного кабинета.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full space-y-4 overflow-x-hidden px-3 py-4 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-readable-xs text-muted-high-contrast">
            <span>{rangeLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-readable-2xl font-medium text-high-contrast">Дашборд собственника</h1>
            <Badge variant="outline" className="text-readable-xs">
              {globalData.periodLabel}
            </Badge>
            <Badge
              variant="secondary"
              className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
            >
              {selectedCabinet?.label}
            </Badge>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 justify-center">
          <AnalyticsNavLinks />
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            className="border border-emerald-500/35 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="size-4" />
            Вернуться на главный дашборд
          </Button>
          <PeriodTabs selectedPeriod={globalPeriod} onPeriodChange={setGlobalPeriod} />
        </div>
      </div>

      <CabinetSwitcher
        value={selectedCabinetId}
        options={ownerContext.availableCabinets}
        onValueChange={(value) => {
          setSelectedCabinetId(value)
          const selected = ownerContext.availableCabinets.find((cabinet) => cabinet.id === value)
          if (cityId && selected?.personId) {
            navigate(`/city/${cityId}/partner/${selected.personId}`)
          }
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <StaticKpiCards
            data={globalData.staticKpi}
            referralsLabel="Партнеры L1"
            secondMetric={{ label: "Рефералы L2", value: level2ReferralsTotal }}
          />
          <DynamicKpiCards
            data={globalData.dynamicKpi}
            todayData={todayData?.dynamicKpi}
            periodLabel={globalData.periodLabel}
          />
          <ActivityComposition data={globalData.dynamicKpi} />
          <HierarchyPreview
            hierarchy={ownerContext.hierarchy}
            activePersonId={selectedCabinet?.personId ?? null}
            onOpenTree={() => setHierarchyDialogOpen(true)}
          />
          <HierarchyTreeDialog
            open={hierarchyDialogOpen}
            onOpenChange={setHierarchyDialogOpen}
            hierarchy={ownerContext.hierarchy}
            cityId={cityId ?? undefined}
            activePersonId={selectedCabinet?.personId ?? null}
            onSelectPartner={(personId) => {
              if (cityId) {
                navigate(`/city/${cityId}/partner/${personId}`)
                setHierarchyDialogOpen(false)
              }
            }}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-readable-sm text-high-contrast">Партнёры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <Input
                value={partnerListSearch}
                onChange={(e) => setPartnerListSearch(e.target.value)}
                placeholder="Поиск по имени"
                className="h-10 text-readable-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllPartnersModalOpen(true)}
                  className="text-readable-xs"
                >
                  Посмотреть всех партнёров
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllPartners}
                  className="text-readable-xs"
                >
                  Выбрать весь список
                </Button>
                {selectedPartners.size > 0 && (
                  <span className="text-readable-xs text-muted-high-contrast self-center">
                    Выбрано: {selectedPartners.size}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "space-y-0.5 rounded-md border bg-muted/20",
                  partnerListFiltered.length > 10 && "max-h-[280px] overflow-y-auto"
                )}
              >
                {partnerListFiltered.length === 0 ? (
                  <div className="px-3 py-4 text-center text-readable-sm text-muted-high-contrast">
                    {partnerListSearch.trim() ? "Ничего не найдено" : "Нет партнёров"}
                  </div>
                ) : (
                  partnerListFiltered.map((partner) => (
                    <div
                      key={partner.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-3 text-readable-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        selectedCabinet?.personId === partner.id &&
                          "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPartners.has(partner.id)}
                        onChange={() => handleTogglePartnerSelection(partner.id)}
                        className="size-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (cityId) navigate(`/city/${cityId}/partner/${partner.id}`)
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="truncate">{partner.name}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex w-full flex-col gap-4 self-start">
          <div className="flex flex-col gap-3 rounded-lg border bg-card px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-4">
            <div className="min-w-0 flex-1">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск партнёра"
                className="h-10 text-readable-base"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="owner-only-online"
                checked={onlyOnline}
                onCheckedChange={setOnlyOnline}
              />
              <Label htmlFor="owner-only-online" className="text-readable-sm font-normal text-high-contrast">
                Только онлайн
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="owner-inactive-last7"
                checked={inactiveLast7}
                onCheckedChange={setInactiveLast7}
              />
              <Label
                htmlFor="owner-inactive-last7"
                className="text-readable-sm font-normal text-high-contrast"
              >
                Не активные 7 дней
              </Label>
            </div>
          </div>

          <LeaderboardTable
            partners={sortedPartners}
            maxLeadsAdded={maxLeadsAdded}
            maxStageChangesCount={maxStageChangesCount}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onResetFilters={handleResetFilters}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsChart data={leadsData} period={leadsPeriod} onPeriodChange={setLeadsPeriod} />
        <ActivityChart
          data={activityData}
          period={activityPeriod}
          onPeriodChange={setActivityPeriod}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <ActivityCalendarCard
          period={globalPeriod}
          range={range}
          monthRange={monthRangeForCalendar}
          monthData={monthCalendarData}
          allTimeData={allTimeCalendarData}
          className="h-full xl:col-span-8"
        />
        {salesFunnel ? (
          <ConversionOverviewChart funnel={salesFunnel} className="h-full xl:col-span-4" />
        ) : (
          <Card className="h-full xl:col-span-4">
            <CardContent className="flex h-full items-center justify-center p-6 text-readable-sm text-muted-high-contrast">
              Нет данных по воронке продаж.
            </CardContent>
          </Card>
        )}
      </div>

      <PersonalAnalyticsInsights
        dynamicKpi={globalData.dynamicKpi}
        funnels={globalData.funnels}
        period={globalPeriod}
        allowPlanEditing={selectedCabinet?.scope === "me"}
      />

      <div className="space-y-3">
        <div className="text-center">
          <p className="text-readable-base font-medium text-high-contrast">Активность партнеров</p>
          <p className="text-readable-sm text-muted-high-contrast">
            Топ по лидам и распределение по активности за выбранный период.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TopReferralsChart
            partners={topReferralsPartners}
            period={topReferralsPeriod}
            onPeriodChange={setTopReferralsPeriod}
          />
          <PartnersActivityDistribution
            partners={engagementPartners}
            period={engagementPeriod}
            onPeriodChange={setEngagementPeriod}
            onSegmentClick={(marker) => setSelectedActivityMarker(marker)}
          />
        </div>
      </div>

      <FunnelKanban funnels={globalData.funnels} />

      {selectedActivityMarker !== null && (
        <Dialog
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedActivityMarker(null)
          }}
        >
          <DialogContent className="max-w-lg sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedActivityMarker === "green"
                  ? "Активные партнёры"
                  : selectedActivityMarker === "yellow"
                    ? "Средние партнёры"
                    : "Пассивные партнёры"}
              </DialogTitle>
              <DialogDescription>
                {selectedActivityPartners.length}{" "}
                {selectedActivityPartners.length === 1 ? "партнёр" : "партнёров"} в
                этой группе.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 max-h-[400px] space-y-3 overflow-y-auto">
              {selectedActivityPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:p-1"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-readable-sm font-medium text-high-contrast">{partner.name}</div>
                    <p className="text-readable-xs text-muted-high-contrast">
                      Лиды: {partner.leadsAdded.toLocaleString("ru-RU")} · Активность:{" "}
                      {partner.activityTotal.toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    onClick={() => {
                      if (!cityId) return
                      navigate(`/city/${cityId}/partner/${partner.id}`)
                      setSelectedActivityMarker(null)
                    }}
                  >
                    Карточка
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {allPartnersModalOpen && (
        <Dialog
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setAllPartnersModalOpen(false)
          }}
        >
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-readable-xl font-medium text-high-contrast">
                Все партнёры сети
              </DialogTitle>
              <DialogDescription className="text-readable-base text-muted-high-contrast">
                Полный список всех партнёров в сети. Вы можете выбрать партнёров для массовых действий.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {globalData?.partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPartners.has(partner.id)}
                      onChange={() => handleTogglePartnerSelection(partner.id)}
                      className="size-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="text-readable-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {partner.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-readable-base font-medium text-high-contrast">
                        {partner.name}
                      </div>
                      <div className="text-readable-xs text-muted-high-contrast">
                        Лиды: {partner.leadsAdded.toLocaleString("ru-RU")} · 
                        Партнёры: {partner.level1Count} · 
                        Рефералы L2: {partner.level2Count}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (cityId) {
                          navigate(`/city/${cityId}/partner/${partner.id}`)
                          setAllPartnersModalOpen(false)
                        }
                      }}
                      className="text-readable-xs"
                    >
                      Открыть
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t pt-4 flex justify-between items-center">
              <span className="text-readable-sm text-muted-high-contrast">
                Всего партнёров: {globalData?.partners.length || 0} · 
                Выбрано: {selectedPartners.size}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPartners(new Set())}
                  className="text-readable-xs"
                >
                  Очистить выбор
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAllPartnersModalOpen(false)
                  }}
                  className="text-readable-xs"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function HierarchyPreview({
  hierarchy,
  activePersonId,
  onOpenTree,
}: {
  hierarchy: OwnerHierarchyNode[]
  activePersonId: string | null
  onOpenTree?: () => void
}) {
  const root = hierarchy.find((node) => node.role === "supreme_owner")
  const byId = new Map(hierarchy.map((node) => [node.id, node]))
  const masters = root
    ? root.childrenIds
        .map((id) => byId.get(id))
        .filter((node): node is OwnerHierarchyNode => Boolean(node))
    : []

  const cardContent = (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-readable-sm text-high-contrast">Иерархия партнеров</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <div className="rounded-md border bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-emerald-600" />
            <span className="text-readable-sm font-medium text-high-contrast">Вы — Основатель сети</span>
          </div>
        </div>

        <div className="space-y-2">
          {masters.map((master) => {
            const children = master.childrenIds
              .map((id) => byId.get(id))
              .filter((node): node is OwnerHierarchyNode => Boolean(node))
            const isActive = activePersonId === master.personId
            return (
              <div key={master.id} className="rounded-md border bg-background p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <GitBranch className="size-4 text-blue-600" />
                    <p className="truncate text-readable-sm font-medium text-high-contrast">{master.label}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-readable-xs",
                      isActive &&
                        "border-blue-500/40 bg-blue-500/10 text-blue-700"
                    )}
                  >
                    {children.length} партнеров
                  </Badge>
                </div>
                {children.length > 0 && (
                  <p className="mt-1.5 text-readable-xs text-muted-high-contrast">
                    {children
                      .slice(0, 3)
                      .map((child) => child.label)
                      .join(", ")}
                    {children.length > 3 ? "..." : ""}
                  </p>
                )}
              </div>
            )
          })}
          {masters.length === 0 && (
            <div className="rounded-md border border-dashed px-3 py-4 text-center text-readable-xs text-muted-high-contrast">
              Нет данных по иерархии.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-md border bg-muted/15 px-3 py-2 text-readable-xs text-muted-high-contrast">
          <Users className="size-3.5" />
          {onOpenTree ? "Нажмите, чтобы открыть дерево партнёров" : "Переключайте кабинеты, чтобы смотреть аналитику по сети и по каждому партнеру."}
        </div>
      </CardContent>
    </>
  )

  if (onOpenTree) {
    return (
      <Card
        role="button"
        tabIndex={0}
        className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onOpenTree}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpenTree()
          }
        }}
      >
        {cardContent}
      </Card>
    )
  }

  return <Card>{cardContent}</Card>
}

// ─── Helper: compute level-by-level (BFS) array from flat hierarchy ──────────
function buildLevels(hierarchy: OwnerHierarchyNode[]): OwnerHierarchyNode[][] {
  const byId = new Map(hierarchy.map((n) => [n.id, n]))
  const root = hierarchy.find((n) => n.role === "supreme_owner")
  if (!root) return []
  const levels: OwnerHierarchyNode[][] = []
  let current: OwnerHierarchyNode[] = [root]
  while (current.length > 0) {
    levels.push(current)
    const next: OwnerHierarchyNode[] = []
    for (const node of current) {
      for (const childId of node.childrenIds) {
        const child = byId.get(childId)
        if (child) next.push(child)
      }
    }
    current = next
  }
  return levels
}

function HierarchyTreeDialog({
  open,
  onOpenChange,
  hierarchy,
  cityId,
  activePersonId,
  onSelectPartner,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  hierarchy: OwnerHierarchyNode[]
  cityId?: string
  activePersonId: string | null
  onSelectPartner: (personId: string) => void
}) {
  const [view, setView] = useState<"tree" | "analytics">("tree")
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setView("tree")
      setSelectedPersonId(null)
    }
    onOpenChange(nextOpen)
  }

  const handleCardClick = (personId: string) => {
    setSelectedPersonId(personId)
    setView("analytics")
  }

  const handleBack = () => {
    setView("tree")
    setSelectedPersonId(null)
  }

  const handleOpenCabinet = (personId: string) => {
    onSelectPartner(personId)
    handleOpenChange(false)
  }

  const levels = useMemo(() => buildLevels(hierarchy), [hierarchy])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !rounded-none !p-0 !border-0 !m-0 bg-background overflow-hidden flex flex-col">
        <DialogHeader className="border-b px-6 py-4 bg-muted/30 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-readable-2xl font-medium text-high-contrast">
                Иерархия партнёров
              </DialogTitle>
              <DialogDescription className="text-readable-lg text-muted-high-contrast">
                Дерево партнёров с визуализацией MLM-структуры. Нажмите на партнёра, чтобы открыть его аналитику.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="shrink-0 gap-1.5"
            >
              <X className="size-4" />
              Закрыть
            </Button>
          </div>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
          {/* TREE VIEW */}
          <div
            className={cn(
              "absolute inset-0 overflow-auto transition-all duration-500 ease-in-out",
              view === "tree"
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-6 pointer-events-none"
            )}
          >
            <HierarchyOrgChart
              levels={levels}
              activePersonId={activePersonId}
              onCardClick={handleCardClick}
            />
          </div>

          {/* ANALYTICS DRILL-DOWN VIEW */}
          <div
            className={cn(
              "absolute inset-0 overflow-auto transition-all duration-500 ease-in-out",
              view === "analytics"
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-6 pointer-events-none"
            )}
          >
            {selectedPersonId && (
              <PartnerAnalyticsPanel
                personId={selectedPersonId}
                onBack={handleBack}
                onOpenCabinet={cityId ? () => handleOpenCabinet(selectedPersonId) : undefined}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Org chart: renders all levels top-to-bottom ─────────────────────────────
function HierarchyOrgChart({
  levels,
  activePersonId,
  onCardClick,
}: {
  levels: OwnerHierarchyNode[][]
  activePersonId: string | null
  onCardClick: (personId: string) => void
}) {
  if (levels.length === 0) return null

  return (
    <div className="flex flex-col items-center py-10 px-6 gap-0">
      {levels.map((levelNodes, levelIndex) => (
        <div key={levelIndex} className="flex flex-col items-center w-full">
          {/* Connector lines between levels */}
          {levelIndex > 0 && (
            <div className="flex flex-col items-center" style={{ height: 48 }} aria-hidden>
              <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-300 to-slate-400" />
              {levelNodes.length > 1 && (
                <div
                  className="h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent"
                  style={{ width: `${levelNodes.length * 160}px`, maxWidth: "90vw" }}
                />
              )}
              <div className="w-0.5 h-3 bg-slate-400" />
            </div>
          )}
          {/* Row of cards */}
          <div className="flex flex-wrap justify-center gap-5">
            {levelNodes.map((node) => (
              <div key={node.id} className="flex flex-col items-center gap-0">
                {levelIndex > 0 && levelNodes.length > 1 && (
                  <div className="w-0.5 h-3 bg-slate-400" aria-hidden />
                )}
                <HierarchyNodeCard
                  node={node}
                  isActive={activePersonId === node.personId}
                  onClick={() => onCardClick(node.personId)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Single partner card in the org chart ─────────────────────────────────────
function HierarchyNodeCard({
  node,
  isActive,
  onClick,
}: {
  node: OwnerHierarchyNode
  isActive: boolean
  onClick: () => void
}) {
  const summary = getPartnerSummary(node.personId)

  const roleLabel: Record<OwnerHierarchyNode["role"], string> = {
    supreme_owner: "Собственник",
    master_partner: "Мастер-партнёр",
    partner: "Партнёр",
  }

  const roleBadgeClass: Record<OwnerHierarchyNode["role"], string> = {
    supreme_owner: "bg-emerald-100 text-emerald-800 border-emerald-300",
    master_partner: "bg-blue-100 text-blue-800 border-blue-300",
    partner: "bg-slate-100 text-slate-700 border-slate-300",
  }

  const avatarGradient: Record<OwnerHierarchyNode["role"], string> = {
    supreme_owner: "from-emerald-500 to-teal-600",
    master_partner: "from-blue-500 to-indigo-600",
    partner: "from-slate-400 to-slate-600",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 w-36 p-3 rounded-2xl border bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-xl hover:scale-105 hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive && "border-primary/50 bg-primary/5 shadow-md"
      )}
    >
      {/* Avatar with online dot */}
      <div className={cn(
        "relative rounded-full",
        isActive && "ring-4 ring-primary ring-offset-2"
      )}>
        <Avatar className="size-20 border-2 border-white shadow-md">
          {summary?.avatarUrl ? (
            <AvatarImage src={summary.avatarUrl} alt={node.label} />
          ) : null}
          <AvatarFallback
            className={cn(
              "text-xl font-bold text-white bg-gradient-to-br",
              avatarGradient[node.role]
            )}
          >
            {node.label.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {summary?.isOnline && (
          <span className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </div>

      {/* Name */}
      <span className="w-full text-center text-xs font-semibold text-high-contrast leading-tight line-clamp-2">
        {node.label}
      </span>

      {/* Role badge */}
      <span className={cn(
        "w-full text-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
        roleBadgeClass[node.role]
      )}>
        {roleLabel[node.role]}
      </span>

      {/* KPI chips */}
      {summary && (
        <div className="flex flex-wrap justify-center gap-1">
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-medium">
            {summary.leadsAdded} лид.
          </span>
          {node.role !== "partner" && (
            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-medium">
              {summary.level1Count} парт.
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ─── Partner analytics drill-down panel ───────────────────────────────────────
function PartnerAnalyticsPanel({
  personId,
  onBack,
  onOpenCabinet,
}: {
  personId: string
  onBack: () => void
  onOpenCabinet?: () => void
}) {
  const summary = getPartnerSummary(personId)
  const analytics = getPersonAnalyticsData(personId, "week")

  if (!summary || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <Button variant="ghost" onClick={onBack} className="self-start">
          <ArrowLeft className="size-4 mr-2" />
          Назад
        </Button>
        <p className="text-muted-high-contrast">Данные партнёра не найдены.</p>
      </div>
    )
  }

  const { person, staticKpi, dynamicKpi } = analytics

  const activityConfig: Record<ActivityMarker, { label: string; color: string }> = {
    green: { label: "Активный", color: "bg-emerald-500" },
    yellow: { label: "Средний", color: "bg-amber-500" },
    red: { label: "Пассивный", color: "bg-rose-500" },
  }
  const activity = activityConfig[person.activityMarker]

  const kpiCards = [
    {
      label: "Лиды (неделя)",
      value: dynamicKpi.addedLeads,
      icon: <TrendingUp className="size-5 text-blue-600" />,
      colorClass: "bg-blue-50 border-blue-100",
    },
    {
      label: "Партнёры L1",
      value: staticKpi.level1Referrals,
      icon: <Users className="size-5 text-purple-600" />,
      colorClass: "bg-purple-50 border-purple-100",
    },
    {
      label: "Рефералы L2",
      value: person.level2Count,
      icon: <Star className="size-5 text-amber-600" />,
      colorClass: "bg-amber-50 border-amber-100",
    },
    {
      label: "Сделки (всего)",
      value: staticKpi.totalDeals,
      icon: <TrendingUp className="size-5 text-emerald-600" />,
      colorClass: "bg-emerald-50 border-emerald-100",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="-ml-2 self-start text-muted-high-contrast hover:text-high-contrast"
      >
        <ArrowLeft className="size-4 mr-2" />
        Вернуться к дереву
      </Button>

      {/* Identity block */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <Avatar className="size-24 border-4 border-white shadow-lg">
            {person.avatarUrl ? (
              <AvatarImage src={person.avatarUrl} alt={person.name} />
            ) : null}
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {person.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {person.isOnline && (
            <span className="absolute bottom-1 right-1 size-4 rounded-full bg-emerald-500 border-2 border-white" />
          )}
        </div>

        <div className="min-w-0 flex flex-col gap-2">
          <h2 className="text-readable-2xl font-bold text-high-contrast truncate">
            {person.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-readable-xs">
              {person.isOnline ? "Онлайн сейчас" : "Не в сети"}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full shrink-0", activity.color)} />
              <span className="text-readable-xs text-muted-high-contrast">{activity.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className={cn("border", kpi.colorClass)}>
            <CardContent className="flex flex-col items-center gap-1.5 p-4 text-center">
              {kpi.icon}
              <span className="text-2xl font-bold text-high-contrast">
                {kpi.value.toLocaleString("ru-RU")}
              </span>
              <span className="text-[11px] text-muted-high-contrast leading-tight">
                {kpi.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Open cabinet */}
      {onOpenCabinet && (
        <Button
          onClick={onOpenCabinet}
          size="lg"
          className="self-start"
        >
          Открыть кабинет партнёра
        </Button>
      )}
    </div>
  )
}
