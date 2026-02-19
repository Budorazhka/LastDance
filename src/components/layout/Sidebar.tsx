import { useNavigate, useParams } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const navigate = useNavigate()
  const { cityId } = useParams()

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-white py-4">
      <button
        type="button"
        onClick={() => navigate('/')}
        title="Обзор"
        className={cn(
          'flex size-10 items-center justify-center rounded-lg transition-colors',
          !cityId
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        )}
      >
        <LayoutDashboard className="size-5" />
      </button>
    </aside>
  )
}
