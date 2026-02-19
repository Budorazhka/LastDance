"use client";
// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: распределение партнёров по активности; тут ты фильтруешь по marker и показываешь сегменты.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.


import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Pie, PieChart, Cell, Label } from "recharts";
import { cn } from "@/lib/utils";
import type { PartnerRow, AnalyticsPeriod, ActivityMarker } from "@/types/analytics";

interface PartnersActivityDistributionProps {
    partners: PartnerRow[];
    period: AnalyticsPeriod;
    onPeriodChange: (period: AnalyticsPeriod) => void;
    onSegmentClick?: (marker: ActivityMarker) => void;
}

const chartConfig = {
    green: {
        label: "Активные",
        color: "hsl(142, 76%, 36%)",
    },
    yellow: {
        label: "Средние",
        color: "hsl(45, 93%, 47%)",
    },
    red: {
        label: "Пассивные",
        color: "hsl(0, 84%, 60%)",
    },
} satisfies ChartConfig;

const periods: { value: AnalyticsPeriod; label: string }[] = [
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "allTime", label: "За всё время" },
];

const segmentLabels: Record<string, string> = {
    green: "активны",
    yellow: "средние",
    red: "пассивны",
};

export function PartnersActivityDistribution({ partners, period, onPeriodChange, onSegmentClick }: PartnersActivityDistributionProps) {
    const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);

    if (partners.length === 0) {
        return null;
    }

    const distribution = [
        {
            key: "green",
            label: "Активные",
            value: partners.filter((p) => p.activityMarker === "green").length,
            color: "var(--color-green)",
        },
        {
            key: "yellow",
            label: "Средние",
            value: partners.filter((p) => p.activityMarker === "yellow").length,
            color: "var(--color-yellow)",
        },
        {
            key: "red",
            label: "Пассивные",
            value: partners.filter((p) => p.activityMarker === "red").length,
            color: "var(--color-red)",
        },
    ];

    const totalPartners = partners.length;
    const activeCount = distribution.find((d) => d.key === "green")?.value || 0;
    const activePercent = totalPartners > 0 ? Math.round((activeCount / totalPartners) * 100) : 0;

    const currentSegmentKey = highlightedSegment ?? "green";
    const currentSegment = distribution.find((d) => d.key === currentSegmentKey);
    const centerPercent = totalPartners > 0 && currentSegment
        ? Math.round((currentSegment.value / totalPartners) * 100)
        : activePercent;
    const centerLabel = segmentLabels[currentSegmentKey] ?? "активны";
    const riskPartners = partners.filter((partner) =>
        period === "week" ? partner.onlineDaysLast7 === 0 : partner.activityMarker === "red"
    );
    const riskCount = riskPartners.length;
    const riskPercent = totalPartners > 0 ? Math.round((riskCount / totalPartners) * 100) : 0;
    const riskPreview = riskPartners.slice(0, 3);

    return (
        <Card className="w-full">
            <CardHeader className="px-2 pb-2 pt-3 sm:px-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-1.5">
                            <CardTitle className="text-center text-xs sm:text-sm">Распределение активности партнёров</CardTitle>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent transition-colors"
                                        aria-label="Как считается активность"
                                    >
                                        <HelpCircle className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[280px]">
                                    <div className="space-y-1 text-xs">
                                        <p><span className="font-medium">🟢 Активные:</span> работали в платформе или CRM более 20 минут</p>
                                        <p><span className="font-medium">🟡 Средние:</span> заходили, но активность минимальная (1-20 мин)</p>
                                        <p><span className="font-medium">🔴 Пассивные:</span> не проявляли активности</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Всего: <span className="font-medium">{totalPartners.toLocaleString("ru-RU")}</span>
                        </span>
                    </div>
                    <Tabs value={period} onValueChange={(v) => onPeriodChange(v as AnalyticsPeriod)} className="h-auto">
                        <TabsList className="h-auto flex-wrap p-0.5">
                            {periods.map((p) => (
                                <TabsTrigger
                                    key={p.value}
                                    value={p.value}
                                    className="h-7 px-2 text-xs font-normal data-[state=active]:bg-background sm:px-2.5 sm:text-sm"
                                >
                                    {p.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-2 pb-4 pt-2 sm:flex-row sm:items-center sm:gap-6 sm:px-4">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[220px] shrink-0 sm:mx-0 sm:max-w-[240px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                            data={distribution}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius="32%"
                            outerRadius="48%"
                            strokeWidth={0}
                        >
                            {distribution.map((item) => (
                                <Cell
                                    key={item.key}
                                    fill={item.color}
                                    className="cursor-pointer transition-opacity"
                                    opacity={highlightedSegment && highlightedSegment !== item.key ? 0.35 : 1}
                                    onClick={() => {
                                        setHighlightedSegment((prev) => prev === item.key ? null : item.key);
                                        onSegmentClick?.(item.key as ActivityMarker);
                                    }}
                                />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-xl font-medium sm:text-2xl"
                                                >
                                                    {centerPercent}%
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 16}
                                                    className="fill-muted-foreground text-[10px] sm:text-xs"
                                                >
                                                    {centerLabel}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="w-full flex-1 space-y-3">
                    <div className="space-y-2">
                        {distribution.map((item) => {
                            const percent = totalPartners > 0 ? Math.round((item.value / totalPartners) * 100) : 0;
                            const isSelected = highlightedSegment === item.key;
                            return (
                                <div
                                    key={item.key}
                                    className={cn(
                                        "flex items-center gap-2 rounded-md px-2 py-1 text-xs cursor-pointer transition-all",
                                        isSelected
                                            ? "bg-accent/60 font-medium"
                                            : highlightedSegment
                                              ? "opacity-50 hover:opacity-80"
                                              : "hover:bg-accent/30"
                                    )}
                                    onClick={() => {
                                        setHighlightedSegment((prev) => prev === item.key ? null : item.key);
                                        onSegmentClick?.(item.key as ActivityMarker);
                                    }}
                                >
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                                    <span className="ml-auto font-medium">{percent}%</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-2.5 sm:p-3">
                        <div className="flex items-center justify-between gap-1.5">
                            <p className="text-[11px] font-medium sm:text-xs">Партнёры в зоне риска</p>
                            <span className="text-[11px] font-medium sm:text-xs">{riskCount.toLocaleString("ru-RU")} ({riskPercent}%)</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                            {period === "week"
                                ? "В зоне риска: партнёры с 0 активных дней за последние 7 дней."
                                : "В зоне риска: все пассивные партнёры за выбранный период."}
                        </p>
                        {riskPreview.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {riskPreview.map((partner) => (
                                    <p key={partner.id} className="truncate text-[11px] text-muted-foreground">
                                        {partner.name}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
