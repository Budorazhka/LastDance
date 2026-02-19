import { Header } from '@/components/layout/Header'
import { BentoGrid } from './BentoGrid'
import { WorldMap } from './WorldMap'
import { cityMapPoints, countries, globalStats } from '@/data/mock'

export function OverviewPage() {
  return (
    <div className="space-y-6">
      <Header title="Панель управления" breadcrumbs={[{ label: 'Обзор' }]} countries={countries} />
      <BentoGrid stats={globalStats} />
      <WorldMap cities={cityMapPoints} />
    </div>
  )
}
