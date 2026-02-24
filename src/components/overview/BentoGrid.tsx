import {
  Clock,
  Handshake,
  Users,
  Target,
  BarChart3,
  Wallet
} from 'lucide-react'
import { StatCard } from './StatCard'
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

  // Данные за все время не имеют динамики
  const hasTrends = period !== 'allTime'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 max-w-full">
      <StatCard
        label="Новые Лиды"
        value={current.leads.toLocaleString('ru-RU')}
        icon={Target}
        description={`Из ${current.activeCities} городов`}
        trendPercent={hasTrends ? trendsPercent.leads : undefined}
        trendLabel={trendText}
        className="bg-sky-50"
      />
      <StatCard
        label="Сделки"
        value={current.deals}
        icon={Handshake}
        description={`Конверсия сети: ${current.leads > 0 ? Math.round((current.deals / current.leads) * 100) : 0}%`}
        trendPercent={hasTrends ? trendsPercent.deals : undefined}
        trendLabel={trendText}
        className="bg-emerald-50"
      />
      <StatCard
        label="Активность"
        value={current.activity.toLocaleString('ru-RU')}
        icon={BarChart3}
        description="Звонки + чаты + подборки"
        trendPercent={hasTrends ? trendsPercent.activity : undefined}
        trendLabel={trendText}
        className="bg-violet-50"
      />
      <StatCard
        label="Комиссия"
        value={`$${current.revenue.toLocaleString('ru-RU')}`}
        icon={Wallet}
        description="Суммарный доход сети"
        trendPercent={hasTrends ? trendsPercent.revenue : undefined}
        trendLabel={trendText}
        className="bg-amber-50"
      />
      <StatCard
        label="Время в системе"
        value={`${current.crmHours.toLocaleString('ru-RU')}ч`}
        icon={Clock}
        description="Запродуктивность сети"
        trendPercent={hasTrends ? trendsPercent.crmHours : undefined}
        trendLabel={trendText}
        className="bg-slate-100"
      />
      <StatCard
        label="Сеть партнеров"
        value={`${current.partnersOnline} / ${current.partnersAll}`}
        icon={Users}
        description="Сейчас онлайн / Всего"
        className="bg-white"
      />
    </div>
  )
}
