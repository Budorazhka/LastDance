import { Clock, DollarSign, Handshake, MapPin, Users } from 'lucide-react'
import { StatCard } from './StatCard'
import type { GlobalStats } from '@/types/dashboard'

interface BentoGridProps {
  stats: GlobalStats
}

export function BentoGrid({ stats }: BentoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard label="Партнеры" value={stats.totalPartners} icon={Users} description="Активные партнеры" />
      <StatCard
        label="Оборот"
        value={`$${stats.totalRevenue.toLocaleString('ru-RU')}`}
        icon={DollarSign}
        description="Общий оборот в USD"
      />
      <StatCard label="Сделки" value={stats.totalDeals} icon={Handshake} description="Закрытые сделки" />
      <StatCard label="Города" value={stats.activeCities} icon={MapPin} description="Активные города" />
      <StatCard
        label="Время в системе"
        value={`${stats.totalCrmHours}ч`}
        icon={Clock}
        description="Суммарное время"
      />
    </div>
  )
}
