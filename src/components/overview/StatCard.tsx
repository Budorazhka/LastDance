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
  const trendBgColor = isPositive
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isNegative
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-50 text-slate-600 border-slate-200'
  const formattedPercent = trendPercent ? `${trendPercent > 0 ? '+' : ''}${trendPercent}%` : '0%'

  const cardContent = (
    <Card className={cn(
      "flex flex-col items-center justify-center px-2.5 py-2 transition-transform hover:-translate-y-0.5 hover:shadow-md border border-slate-200 rounded-lg bg-white/90 h-full min-h-[64px]",
      className
    )}>
      <CardContent className="p-0 flex flex-col items-center justify-center text-center w-full h-full gap-0.5 sm:gap-1">
        <div className="rounded-md bg-slate-100 p-1.5 shadow-xs flex items-center justify-center shrink-0 text-slate-700">
          <Icon className="size-3 stroke-[2.1px]" />
        </div>

        <div className="flex flex-col items-center w-full gap-0 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 leading-tight">
            {label}
          </span>

          <div className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 leading-none mt-0.5 mb-0">
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </div>

          {typeof trendPercent === 'number' && (
            <div
              className={cn("inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap", trendBgColor)}
            >
              <TrendIcon className="mr-0.5 size-2 stroke-[2.1px]" />
              {formattedPercent}
            </div>
          )}

          {description && (
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 leading-tight mt-0.5 truncate max-w-full">
              {description}
            </p>
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
        <TooltipContent
          sideOffset={4}
          className="bg-white text-slate-900 px-2.5 py-2 border border-slate-200 shadow-md text-[11px] font-medium max-w-[200px] text-center rounded-md"
        >
          <div className="flex items-center justify-center gap-1.5 mb-1 pb-1 border-b border-slate-200">
            <div className={cn("flex items-center px-1.5 py-0.5 rounded-full border text-[11px]", trendBgColor)}>
              <TrendIcon className="mr-1 size-3 stroke-[2.25px]" />
              <span>
                {formattedPercent}
              </span>
            </div>
          </div>
          <p className="leading-tight select-none">
            {trendLabel}
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <div className="h-full block w-full">{cardContent}</div>
}
