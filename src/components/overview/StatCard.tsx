import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
  trendPercent?: number
  trendLabel?: string
  className?: string
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trendPercent,
  trendLabel,
  className
}: StatCardProps) {
  const isPositive = trendPercent && trendPercent > 0
  const isNegative = trendPercent && trendPercent < 0

  const TrendIcon = isPositive ? TrendingUp : (isNegative ? TrendingDown : Minus)
  const trendBgColor = isPositive ? 'bg-emerald-600 text-white border-emerald-800' : (isNegative ? 'bg-rose-600 text-white border-rose-800' : 'bg-slate-200 text-black border-slate-400')
  const formattedPercent = trendPercent ? `${trendPercent > 0 ? '+' : ''}${trendPercent}%` : '0%'

  const cardContent = (
    <Card className={cn("flex flex-col items-center justify-center p-2 sm:p-2.5 transition-transform hover:-translate-y-0.5 hover:shadow-lg border-2 border-slate-900 rounded-lg h-full min-h-[88px]", className)}>
      <CardContent className="p-0 flex flex-col items-center justify-center text-center w-full h-full gap-0.5 sm:gap-1">
        <div className="rounded-full bg-slate-900 p-1.5 sm:p-2 shadow-sm flex items-center justify-center shrink-0">
          <Icon className="size-3 sm:size-4 text-white stroke-[2px]" />
        </div>

        <div className="flex flex-col items-center w-full gap-0 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold text-black uppercase tracking-widest leading-tight">{label}</span>

          <div className="text-base sm:text-lg font-black tracking-tighter text-black leading-none uppercase mt-0.5 mb-0">
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </div>

          {typeof trendPercent === 'number' && (
            <div className={cn("inline-flex items-center text-[9px] sm:text-[10px] font-black px-1 py-0.5 rounded border whitespace-nowrap shadow-sm", trendBgColor)}>
              <TrendIcon className="mr-0.5 size-2 sm:size-2.5 stroke-[3px]" />
              {formattedPercent}
            </div>
          )}

          {description && (
            <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wide leading-tight mt-0.5 truncate max-w-full">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (typeof trendPercent === 'number' && trendLabel) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="h-full cursor-help block w-full">
            {cardContent}
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={4} className="bg-white text-black px-2 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-[10px] font-bold max-w-[180px] text-center rounded-md">
          <div className="flex items-center justify-center gap-1.5 mb-1 pb-1 border-b-2 border-slate-200">
            <div className={cn("flex items-center px-1 py-0.5 rounded border-2", trendBgColor)}>
              <TrendIcon className="mr-0.5 size-3 stroke-[3px]" />
              <span className="text-xs tracking-widest">
                {formattedPercent}
              </span>
            </div>
          </div>
          <p className="tracking-wide uppercase leading-tight select-none">{trendLabel}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <div className="h-full block w-full">{cardContent}</div>
}
