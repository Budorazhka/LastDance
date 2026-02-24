import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface ReferralsStatCardProps {
  valueL1: number
  valueL2: number
  trendPercentL1?: number
  trendPercentL2?: number
  trendLabel?: string
  className?: string
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

function TrendBadge({ trendPercent }: { trendPercent: number }) {
  const isPositive = trendPercent > 0
  const isNegative = trendPercent < 0
  const TrendIcon = isPositive ? TrendingUp : (isNegative ? TrendingDown : Minus)
  const trendBgColor = isPositive ? 'bg-emerald-600 text-white border-emerald-800' : (isNegative ? 'bg-rose-600 text-white border-rose-800' : 'bg-slate-200 text-black border-slate-400')
  const formatted = `${trendPercent > 0 ? '+' : ''}${trendPercent}%`
  return (
    <span className={cn("inline-flex items-center text-[8px] sm:text-[9px] font-black px-0.5 py-0.5 rounded border whitespace-nowrap", trendBgColor)}>
      <TrendIcon className="mr-0.5 size-2 sm:size-2.5 stroke-[3px]" />
      {formatted}
    </span>
  )
}

export function ReferralsStatCard({
  valueL1,
  valueL2,
  trendPercentL1,
  trendPercentL2,
  trendLabel,
  className,
}: ReferralsStatCardProps) {
  const cardContent = (
    <Card className={cn("flex flex-col items-center justify-center p-2 sm:p-2.5 transition-transform hover:-translate-y-0.5 hover:shadow-lg border-2 border-slate-900 rounded-lg h-full min-h-[88px]", className)}>
      <CardContent className="p-0 flex flex-col items-center justify-center text-center w-full h-full gap-0.5 sm:gap-1">
        <div className="rounded-full bg-slate-900 p-1.5 sm:p-2 shadow-sm flex items-center justify-center shrink-0">
          <Users className="size-3 sm:size-4 text-white stroke-[2px]" />
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-black uppercase tracking-widest leading-tight">Рефералы L1 / L2</span>
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full flex-wrap">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase">L1</span>
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-black tracking-tighter text-black leading-none">{valueL1.toLocaleString('ru-RU')}</span>
              {typeof trendPercentL1 === 'number' && <TrendBadge trendPercent={trendPercentL1} />}
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase">L2</span>
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-black tracking-tighter text-black leading-none">{valueL2.toLocaleString('ru-RU')}</span>
              {typeof trendPercentL2 === 'number' && <TrendBadge trendPercent={trendPercentL2} />}
            </div>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wide leading-tight">Добавлено рефералов</p>
      </CardContent>
    </Card>
  )

  if (trendLabel && (typeof trendPercentL1 === 'number' || typeof trendPercentL2 === 'number')) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="h-full cursor-help block w-full">{cardContent}</div>
        </TooltipTrigger>
        <TooltipContent sideOffset={4} className="bg-white text-black px-2 py-1.5 border-2 border-black shadow-[3px_3px_0_0_#000] text-[10px] font-bold max-w-[200px] text-center rounded-md">
          <p className="tracking-wide uppercase leading-tight select-none">{trendLabel}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <div className="h-full block w-full">{cardContent}</div>
}
