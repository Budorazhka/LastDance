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
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const trendBgColor = isPositive
    ? 'bg-emerald-600 text-white border-emerald-800'
    : isNegative
      ? 'bg-rose-600 text-white border-rose-800'
      : 'bg-slate-200 text-black border-slate-400'
  const formatted = `${trendPercent > 0 ? '+' : ''}${trendPercent}%`

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded border px-0.5 py-0.5 text-[8px] font-black sm:text-[9px]',
        trendBgColor
      )}
    >
      <TrendIcon className="mr-0.5 size-2 stroke-[3px] sm:size-2.5" />
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
    <Card
      className={cn(
        'flex h-full min-h-[88px] flex-col items-center justify-center rounded-lg border-2 border-slate-900 p-2 transition-transform hover:-translate-y-0.5 hover:shadow-lg sm:p-2.5',
        className
      )}
    >
      <CardContent className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-0 text-center sm:gap-1">
        <div className="flex shrink-0 items-center justify-center rounded-full bg-slate-900 p-1.5 shadow-sm sm:p-2">
          <Users className="size-3 stroke-[2px] text-white sm:size-4" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest text-black sm:text-xs">
          Рефералы L1 / L2
        </span>

        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-bold uppercase text-slate-700 sm:text-sm">L1</span>
            <div className="flex items-center gap-1">
              <span className="text-base font-black leading-none tracking-tighter text-black sm:text-lg">
                {valueL1.toLocaleString('ru-RU')}
              </span>
              {typeof trendPercentL1 === 'number' && (
                <TrendBadge trendPercent={trendPercentL1} />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-bold uppercase text-slate-700 sm:text-sm">L2</span>
            <div className="flex items-center gap-1">
              <span className="text-base font-black leading-none tracking-tighter text-black sm:text-lg">
                {valueL2.toLocaleString('ru-RU')}
              </span>
              {typeof trendPercentL2 === 'number' && (
                <TrendBadge trendPercent={trendPercentL2} />
              )}
            </div>
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800 sm:text-xs">
          Добавлено рефералов
        </p>
      </CardContent>
    </Card>
  )

  if (trendLabel && (typeof trendPercentL1 === 'number' || typeof trendPercentL2 === 'number')) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="block h-full w-full cursor-help">{cardContent}</div>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={4}
          className="max-w-[200px] rounded-md border-2 border-black bg-white px-2 py-1.5 text-center text-[10px] font-bold text-black shadow-[3px_3px_0_0_#000]"
        >
          <p className="select-none uppercase tracking-wide leading-tight">{trendLabel}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <div className="block h-full w-full">{cardContent}</div>
}
