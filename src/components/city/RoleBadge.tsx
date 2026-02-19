import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PartnerRole } from '@/types/dashboard'

const roleColors: Record<PartnerRole, string> = {
  Первичка: 'bg-green-50 text-green-700 border-green-200',
  'MLS аренда': 'bg-amber-50 text-amber-700 border-amber-200',
  'MLS вторичка': 'bg-violet-50 text-violet-700 border-violet-200',
  Курсы: 'bg-rose-50 text-rose-700 border-rose-200',
}

const roleLabels: Record<PartnerRole, string> = {
  Первичка: 'Первичка',
  'MLS аренда': 'MLS аренда',
  'MLS вторичка': 'MLS вторичка',
  Курсы: 'Курсы',
}

interface RoleBadgeProps {
  role: PartnerRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', roleColors[role])}>
      {roleLabels[role]}
    </Badge>
  )
}
