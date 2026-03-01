import { useNavigate, useParams } from 'react-router-dom'
import { LayoutDashboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  /** Выделить кнопку «Контроль лидов» как активную */
  isLeadsActive?: boolean
}

export function Sidebar({ isLeadsActive = false }: SidebarProps) {
  const navigate = useNavigate()
  const { cityId } = useParams()
  const onOverview = !cityId && !isLeadsActive

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-slate-200/80 bg-sidebar-bg py-4">
      <button
        type="button"
        onClick={() => navigate('/')}
        title="Обзор"
        className={cn(
          'relative flex size-10 items-center justify-center rounded-xl transition-colors',
          onOverview
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        )}
      >
        {onOverview && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-slate-400" />
        )}
        <LayoutDashboard className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => navigate('/leads')}
        title="Контроль лидов"
        className={cn(
          'relative flex size-10 items-center justify-center rounded-xl transition-colors',
          isLeadsActive
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        )}
      >
        {isLeadsActive && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-slate-400" />
        )}
        <Users className="size-5" />
      </button>
    </aside>
  )
}
