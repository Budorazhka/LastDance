import type { City, Partner } from '@/types/dashboard'

export type AnalyticsPeriod = 'week' | 'month' | 'allTime'
export type ActivityMarker = 'green' | 'yellow' | 'red'

export interface AnalyticsPoint {
  label: string
  leads: number
  calls: number
  chats: number
  selections: number
}

export interface ConversionMetrics {
  leadToPresentation: number
  presentationToShowing: number
  showingToDeal: number
  leadToDeal: number
}

export interface FunnelOverview {
  newLeads: number
  presentations: number
  showings: number
  deals: number
  rejected: number
}

export interface PartnerAnalyticsRow {
  partnerId: string
  leadsAdded: number
  callClicks: number
  chatOpens: number
  selectionsCreated: number
  activityTotal: number
  stageChangesCount: number
  onlineDaysLast7: number
  onlineWeekMarkers: ActivityMarker[]
  commissionUsd: number
  isOnline: boolean
  lastSeenMinutesAgo: number | null
  activityMarker: ActivityMarker
  platformMinutesToday: number
  crmMinutesToday: number
  deals: number
}

export interface CityAnalyticsData {
  period: AnalyticsPeriod
  periodLabel: string
  points: AnalyticsPoint[]
  partnerRows: PartnerAnalyticsRow[]
  totals: {
    leads: number
    calls: number
    chats: number
    selections: number
    activity: number
    deals: number
    commissionUsd: number
    activePartners: number
  }
  funnel: FunnelOverview
  conversions: ConversionMetrics
}

export interface PartnerAnalyticsData {
  period: AnalyticsPeriod
  periodLabel: string
  partner: Partner
  row: PartnerAnalyticsRow
  points: AnalyticsPoint[]
  funnel: FunnelOverview
  conversions: ConversionMetrics
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  week: 'Неделя',
  month: 'Месяц',
  allTime: 'За все время',
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function createRng(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function periodMultiplier(period: AnalyticsPeriod) {
  if (period === 'week') return 1
  if (period === 'month') return 4.4
  return 18
}

function activityMarkerByMinutes(platformMinutesToday: number, crmMinutesToday: number): ActivityMarker {
  const total = platformMinutesToday + crmMinutesToday
  if (total >= 45) return 'green'
  if (total >= 15) return 'yellow'
  return 'red'
}

function distributeTotal(total: number, count: number, seedKey: string) {
  if (count <= 0) return []
  if (total <= 0) return new Array<number>(count).fill(0)

  const rng = createRng(hashString(seedKey))
  const weights = new Array<number>(count).fill(0).map(() => 0.35 + rng())
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)

  const values = weights.map((weight) => Math.floor((total * weight) / weightSum))
  let rest = total - values.reduce((sum, value) => sum + value, 0)

  while (rest > 0) {
    const index = Math.floor(rng() * count)
    values[index] += 1
    rest -= 1
  }

  return values
}

function getWeekdayShortName(dayIndexMondayStart: number) {
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return labels[dayIndexMondayStart] ?? labels[0]
}

function getPointLabels(period: AnalyticsPeriod) {
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, index) => getWeekdayShortName(index))
  }

  if (period === 'month') {
    const now = new Date()
    const points: string[] = []
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      points.push(day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }))
    }
    return points
  }

  const now = new Date()
  const points: string[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    points.push(month.toLocaleDateString('ru-RU', { month: 'short' }))
  }
  return points
}

function buildWeekMarkers(seedKey: string, onlineDaysLast7: number): ActivityMarker[] {
  const rng = createRng(hashString(`${seedKey}-week-markers`))
  const activeIndices = new Set<number>()

  while (activeIndices.size < onlineDaysLast7) {
    activeIndices.add(Math.floor(rng() * 7))
  }

  return Array.from({ length: 7 }, (_, index) => {
    if (!activeIndices.has(index)) return 'red'
    return rng() > 0.45 ? 'green' : 'yellow'
  })
}

function buildPartnerRow(partner: Partner, period: AnalyticsPeriod): PartnerAnalyticsRow {
  const seedKey = `${partner.id}-${period}`
  const rng = createRng(hashString(seedKey))
  const multiplier = periodMultiplier(period)

  const basePower = Math.max(4, Math.round(partner.crmMinutes / 900))
  const typeFactor = partner.type === 'master' ? 1.25 : 0.95

  const leadsAdded = Math.max(1, Math.round((basePower * typeFactor + rng() * 5) * multiplier))
  const callClicks = Math.max(1, Math.round(leadsAdded * (3.4 + rng() * 2.1)))
  const chatOpens = Math.max(1, Math.round(leadsAdded * (2.2 + rng() * 1.8)))
  const selectionsCreated = Math.max(1, Math.round(leadsAdded * (1.1 + rng() * 1.2)))
  const activityTotal = callClicks + chatOpens + selectionsCreated
  const stageChangesCount = Math.max(1, Math.round(leadsAdded * 1.25 + selectionsCreated * 0.55))
  const deals = Math.max(0, Math.round(leadsAdded * (0.07 + rng() * 0.05)))

  const platformMinutesToday = Math.round(8 + rng() * 82)
  const crmMinutesToday = Math.round(7 + rng() * 75)
  const activityMarker = activityMarkerByMinutes(platformMinutesToday, crmMinutesToday)
  const isOnline = activityMarker !== 'red' && rng() > 0.18
  const lastSeenMinutesAgo = isOnline ? null : Math.round(12 + rng() * 1320)
  const onlineDaysLast7 = clamp(Math.round((partner.crmMinutes / 12000) * 7 + rng() * 3), 0, 7)
  const onlineWeekMarkers = buildWeekMarkers(seedKey, onlineDaysLast7)

  const commissionUsd = Math.max(
    150,
    Math.round(deals * (700 + rng() * 300) + stageChangesCount * 38 + leadsAdded * 22)
  )

  return {
    partnerId: partner.id,
    leadsAdded,
    callClicks,
    chatOpens,
    selectionsCreated,
    activityTotal,
    stageChangesCount,
    onlineDaysLast7,
    onlineWeekMarkers,
    commissionUsd,
    isOnline,
    lastSeenMinutesAgo,
    activityMarker,
    platformMinutesToday,
    crmMinutesToday,
    deals,
  }
}

function toRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function buildFunnel(leads: number, deals: number, seedKey: string): FunnelOverview {
  const rng = createRng(hashString(`funnel-${seedKey}`))
  const presentations = Math.max(0, Math.round(leads * (0.52 + rng() * 0.14)))
  const showings = Math.max(0, Math.round(presentations * (0.47 + rng() * 0.18)))
  const safeDeals = clamp(deals, 0, showings)
  const rejected = Math.max(0, leads - presentations)

  return {
    newLeads: leads,
    presentations,
    showings,
    deals: safeDeals,
    rejected,
  }
}

function buildConversions(funnel: FunnelOverview): ConversionMetrics {
  return {
    leadToPresentation: toRate(funnel.presentations, funnel.newLeads),
    presentationToShowing: toRate(funnel.showings, funnel.presentations),
    showingToDeal: toRate(funnel.deals, funnel.showings),
    leadToDeal: toRate(funnel.deals, funnel.newLeads),
  }
}

function buildPoints(
  period: AnalyticsPeriod,
  totals: { leads: number; calls: number; chats: number; selections: number },
  seedKey: string
): AnalyticsPoint[] {
  const labels = getPointLabels(period)
  const leads = distributeTotal(totals.leads, labels.length, `${seedKey}-leads`)
  const calls = distributeTotal(totals.calls, labels.length, `${seedKey}-calls`)
  const chats = distributeTotal(totals.chats, labels.length, `${seedKey}-chats`)
  const selections = distributeTotal(totals.selections, labels.length, `${seedKey}-selections`)

  return labels.map((label, index) => ({
    label,
    leads: leads[index] ?? 0,
    calls: calls[index] ?? 0,
    chats: chats[index] ?? 0,
    selections: selections[index] ?? 0,
  }))
}

export function getCityAnalytics(city: City, period: AnalyticsPeriod): CityAnalyticsData {
  const partnerRows = city.partners.map((partner) => buildPartnerRow(partner, period))

  const totals = partnerRows.reduce(
    (acc, row) => {
      acc.leads += row.leadsAdded
      acc.calls += row.callClicks
      acc.chats += row.chatOpens
      acc.selections += row.selectionsCreated
      acc.activity += row.activityTotal
      acc.deals += row.deals
      acc.commissionUsd += row.commissionUsd
      if (row.isOnline) acc.activePartners += 1
      return acc
    },
    {
      leads: 0,
      calls: 0,
      chats: 0,
      selections: 0,
      activity: 0,
      deals: 0,
      commissionUsd: 0,
      activePartners: 0,
    }
  )

  const funnel = buildFunnel(totals.leads, totals.deals, `${city.id}-${period}`)
  const points = buildPoints(period, totals, `${city.id}-${period}`)

  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    points,
    partnerRows,
    totals,
    funnel,
    conversions: buildConversions(funnel),
  }
}

export function getPartnerAnalytics(
  city: City,
  partnerId: string,
  period: AnalyticsPeriod
): PartnerAnalyticsData | null {
  const partner = city.partners.find((item) => item.id === partnerId)
  if (!partner) return null

  const row = buildPartnerRow(partner, period)
  const funnel = buildFunnel(row.leadsAdded, row.deals, `${partner.id}-${period}`)
  const points = buildPoints(
    period,
    {
      leads: row.leadsAdded,
      calls: row.callClicks,
      chats: row.chatOpens,
      selections: row.selectionsCreated,
    },
    `${partner.id}-${period}`
  )

  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    partner,
    row,
    points,
    funnel,
    conversions: buildConversions(funnel),
  }
}
