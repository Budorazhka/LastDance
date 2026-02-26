import {
  Clock,
  Users,
  Target,
  Wallet,
  Presentation,
  Home,
} from 'lucide-react'
import { StatCard } from './StatCard'
import { ReferralsStatCard } from './ReferralsStatCard'
import type { NetworkAnalyticsData, AnalyticsPeriod } from '@/lib/city-analytics'

interface BentoGridProps {
  analytics: NetworkAnalyticsData
}

function getPeriodTrendText(period: AnalyticsPeriod) {
  if (period === 'week') return 'по сравнению с прошлой неделей'
  if (period === 'month') return 'по сравнению с прошлым месяцем'
  return ''
}

export function BentoGrid({ analytics }: BentoGridProps) {
  const { current, trendsPercent, period } = analytics
  const trendText = getPeriodTrendText(period)
  const hasTrends = period !== 'allTime'

  return (
    <div className="flex w-full flex-nowrap gap-2 overflow-x-auto pb-1">
      <div className="min-w-0 shrink-0 flex-1">
        <StatCard
          label="Новые лиды"
          value={current.leads.toLocaleString('ru-RU')}
          icon={Target}
          description={`Из ${current.activeCities} городов`}
          trendPercent={hasTrends ? trendsPercent.leads : undefined}
          trendLabel={trendText}
          className="bg-sky-50"
        />
      </div>

      <div className="min-w-0 shrink-0 flex-1">
        <StatCard
          label="Презентации"
          value={current.presentations.toLocaleString('ru-RU')}
          icon={Presentation}
          description="Встречи по лидам"
          trendPercent={hasTrends ? trendsPercent.presentations : undefined}
          trendLabel={trendText}
          className="bg-rose-50"
        />
      </div>

      <div className="min-w-0 shrink-0 flex-1">
        <ReferralsStatCard
          valueL1={current.referralsL1}
          valueL2={current.referralsL2}
          trendPercentL1={hasTrends ? trendsPercent.referralsL1 : undefined}
          trendPercentL2={hasTrends ? trendsPercent.referralsL2 : undefined}
          trendLabel={trendText}
          className="bg-indigo-50"
        />
      </div>

      <div className="min-w-0 shrink-0 flex-1">
        <StatCard
          label="Всего объектов"
          value={current.objectsTotal.toLocaleString('ru-RU')}
          icon={Home}
          description={`За ${analytics.periodLabel.toLowerCase()}`}
          trendPercent={hasTrends ? trendsPercent.objectsTotal : undefined}
          trendLabel={trendText}
          className="bg-emerald-50"
        />
      </div>

      <div className="min-w-0 shrink-0 flex-1">
        <StatCard
          label="Комиссия"
          value={`$${current.revenue.toLocaleString('ru-RU')}`}
          icon={Wallet}
          description="Суммарный доход сети"
          trendPercent={hasTrends ? trendsPercent.revenue : undefined}
          trendLabel={trendText}
          className="bg-amber-50"
        />
      </div>

      <div className="min-w-0 shrink-0 flex-1">
        <StatCard
          label="Время в системе"
          value={`${current.crmHours.toLocaleString('ru-RU')}ч`}
          icon={Clock}
          trendPercent={hasTrends ? trendsPercent.crmHours : undefined}
          trendLabel={trendText}
          className="bg-slate-100"
        />
      </div>

      <div className="min-w-0 shrink-0 flex-1">
        <StatCard
          label="Сеть рефералов"
          value={`${current.partnersOnline} / ${current.partnersAll}`}
          icon={Users}
          description="Сейчас онлайн / Всего"
          className="bg-white"
        />
      </div>
    </div>
  )
}
