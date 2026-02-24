import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  ChevronRight,
  Crown,
  Handshake,
  Plus,
  Timer,
  Users,
  Wallet,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { AddPartnerDialog } from '@/components/management/AddPartnerDialog'
import { AssignRolesDialog } from '@/components/management/AssignRolesDialog'
import { RoleBadge } from './RoleBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCrmTime, getMasterPartners, getSubPartners } from '@/data/mock'
import { getCityAnalytics, type ActivityMarker, type AnalyticsPeriod } from '@/lib/city-analytics'
import type { City, Country, Partner, Permission } from '@/types/dashboard'

interface CityOption {
  id: string
  name: string
}

interface CityDetailViewProps {
  city: City
  country?: Country
  countries?: Country[]
  citiesInActiveCountry?: CityOption[]
  onUpdatePermissions: (partnerId: string, permissions: Permission[]) => void
  onAddPartner: (partner: Partner) => void
}

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'allTime', label: 'Все время' },
]

const MARKER_COLORS: Record<ActivityMarker, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
}


export function CityDetailView({
  city,
  country,
  countries,
  citiesInActiveCountry,
  onUpdatePermissions,
  onAddPartner,
}: CityDetailViewProps) {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<AnalyticsPeriod>('week')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const analytics = useMemo(() => getCityAnalytics(city, period), [city, period])
  const crmMinutesTotal = useMemo(
    () => city.partners.reduce((sum, partner) => sum + partner.crmMinutes, 0),
    [city.partners]
  )
  const partnerRowsById = useMemo(
    () => new Map(analytics.partnerRows.map((row) => [row.partnerId, row])),
    [analytics.partnerRows]
  )
  const masters = useMemo(() => getMasterPartners(city.partners), [city.partners])

  const hierarchyRows = useMemo(() => {
    const rows: Array<{ partner: Partner; level: 0 | 1; isMaster: boolean }> = []
    const used = new Set<string>()
    const rootPartners = masters.length > 0 ? masters : city.partners

    rootPartners.forEach((master) => {
      rows.push({ partner: master, level: 0, isMaster: master.type === 'master' })
      used.add(master.id)

      if (master.type === 'master') {
        getSubPartners(city.partners, master.id).forEach((sub) => {
          rows.push({ partner: sub, level: 1, isMaster: false })
          used.add(sub.id)
        })
      }
    })

    city.partners.forEach((partner) => {
      if (!used.has(partner.id)) {
        rows.push({ partner, level: 0, isMaster: partner.type === 'master' })
      }
    })

    return rows
  }, [city.partners, masters])

  const stats = [
    {
      label: 'Лиды',
      value: analytics.totals.leads.toLocaleString('ru-RU'),
      note: `Период: ${analytics.periodLabel.toLowerCase()}`,
      icon: Users,
      iconClass: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Сделки',
      value: analytics.totals.deals.toLocaleString('ru-RU'),
      note: `Конверсия в сделку: ${analytics.conversions.leadToDeal}%`,
      icon: Handshake,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Активные действия',
      value: analytics.totals.activity.toLocaleString('ru-RU'),
      note: 'Звонки, показы и подборки',
      icon: BarChart3,
      iconClass: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Комиссия',
      value: `$${analytics.totals.commissionUsd.toLocaleString('ru-RU')}`,
      note: `${analytics.totals.activePartners} партнеров онлайн`,
      icon: Wallet,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Время в системе',
      value: formatCrmTime(crmMinutesTotal),
      note: `${city.partners.length} партнеров в городе`,
      icon: Timer,
      iconClass: 'bg-slate-100 text-slate-700',
    },
  ]

  return (
    <div className="space-y-6">
      <Header
        title={`Город ${city.name} • Супер-админ`}
        breadcrumbs={[
          { label: 'Мир', href: '/' },
          { label: country?.name ?? 'Страна' },
          { label: city.name },
        ]}
        countries={countries}
        activeCityId={city.id}
        citiesInActiveCountry={citiesInActiveCountry}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          {PERIOD_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={
                'rounded-full px-3 py-1.5 text-sm transition-colors ' +
                (item.value === period
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Добавить партнера
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="py-4">
            <CardContent className="p-0 px-5">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-lg ${stat.iconClass}`}>
                  <stat.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{stat.note}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Партнеры города</CardTitle>
          <CardDescription>Иерархия City Master и sub-partners</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {hierarchyRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Партнеры еще не добавлены</p>
          ) : (
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Партнер</th>
                  <th className="py-2 pr-4">Роль</th>
                  <th className="py-2 pr-4">Время в системе</th>
                  <th className="py-2 pr-4">Активность</th>
                  <th className="py-2 pr-4">Онлайн 7д</th>
                  <th className="py-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {hierarchyRows.map(({ partner, level, isMaster }) => {
                  const row = partnerRowsById.get(partner.id)
                  if (!row) return null

                  return (
                    <tr
                      key={partner.id}
                      className={
                        'border-b border-slate-100 last:border-b-0 ' +
                        (level === 1 ? 'bg-slate-50/70' : '')
                      }
                    >
                      <td className="py-3 pr-4">
                        <div className={`flex items-start gap-2 ${level === 1 ? 'pl-6' : ''}`}>
                          {level === 1 && <ChevronRight className="mt-0.5 size-3.5 text-slate-400" />}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium text-foreground">{partner.name}</span>
                              {isMaster && <Crown className="size-4 text-amber-500" />}
                              {isMaster && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  Мастер города
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{partner.login}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          {partner.roles.length > 0 ? (
                            partner.roles.map((role) => <RoleBadge key={role} role={role} />)
                          ) : (
                            <span className="text-xs text-muted-foreground">Роли не назначены</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{formatCrmTime(partner.crmMinutes)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${MARKER_COLORS[row.activityMarker]}`} />
                          <span className="font-medium text-foreground">{row.activityTotal}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Лиды: {row.leadsAdded} • Сделки: {row.deals}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          {row.onlineWeekMarkers.map((marker, markerIndex) => (
                            <span
                              key={`${partner.id}-${markerIndex}`}
                              className={`size-2 rounded-full ${MARKER_COLORS[marker]}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPartner(partner)
                              setRolesDialogOpen(true)
                            }}
                          >
                            Доступы
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/city/${city.id}/partner/${partner.id}`)}>
                            Аналитика
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AssignRolesDialog
        partner={selectedPartner}
        open={rolesDialogOpen}
        onOpenChange={setRolesDialogOpen}
        onSave={onUpdatePermissions}
      />

      <AddPartnerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        cityId={city.id}
        existingMasters={masters}
        onAdd={onAddPartner}
      />
    </div>
  )
}
