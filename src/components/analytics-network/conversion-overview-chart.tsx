"use client";
// [DOC-RU]
// Если ты меняешь этот файл, оставляй график и расшифровку читаемыми:
// пользователь должен сразу понимать, от какого этапа к какому считается процент.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { FunnelBoard } from "@/types/analytics";
import type { SVGProps } from "react";

interface ConversionOverviewChartProps {
    funnel: FunnelBoard;
    className?: string;
    /** При переданном колбэке в шапке карточки показывается кнопка «Сеть» (просмотр сети партнёра) */
    onViewNetwork?: () => void;
}

const chartConfig = {
    value: {
        label: "Конверсия",
        color: "hsl(214, 84%, 56%)",
    },
} satisfies ChartConfig;

type ConversionAxisTickProps = SVGProps<SVGTextElement> & {
    payload?: { value?: string };
};

type ConversionItem = {
    key: string;
    label: string;
    value: number;
    color: string;
    description: string;
};

function ConversionAxisTick({ x = 0, y = 0, payload }: ConversionAxisTickProps) {
    return (
        <text x={Number(x) - 4} y={Number(y) + 5} textAnchor="end" className="fill-slate-700 text-[14px] font-medium">
            {payload?.value ?? ""}
        </text>
    );
}

function getStageCumulativeCount(board: FunnelBoard, stageName: string): number {
    let count = 0;
    let found = false;
    const flowColumnIds = ["in_progress", "active", "success"];

    for (const colId of flowColumnIds) {
        const column = board.columns.find((item) => item.id === colId);
        if (!column) continue;

        for (const stage of column.stages) {
            if (stage.name === stageName) found = true;
            if (found) count += stage.count;
        }
    }

    return count;
}

function calculateConversion(board: FunnelBoard, fromStage: string, toStage: string): number {
    const fromCount = getStageCumulativeCount(board, fromStage);
    const toCount = getStageCumulativeCount(board, toStage);
    if (fromCount === 0) return 0;
    return Math.round((toCount / fromCount) * 100);
}

export function ConversionOverviewChart({ funnel, className, onViewNetwork }: ConversionOverviewChartProps) {
    const data: ConversionItem[] = [
        {
            key: "leadToPresentation",
            label: "Лид → През.",
            value: calculateConversion(funnel, "Новый лид", "Презентовали компанию"),
            color: "hsl(214, 84%, 56%)",
            description: "Из новых лидов дошли до презентации",
        },
        {
            key: "presentationToShowing",
            label: "Презент. → Показ",
            value: calculateConversion(funnel, "Презентовали компанию", "Показ"),
            color: "hsl(195, 92%, 45%)",
            description: "Из презентаций дошли до показа",
        },
        {
            key: "showingToDeal",
            label: "Показ → Сделка",
            value: calculateConversion(funnel, "Показ", "Заключен договор"),
            color: "hsl(152, 72%, 37%)",
            description: "Из показов закрылись в сделку",
        },
        {
            key: "leadToDeal",
            label: "Лид → Сделка",
            value: calculateConversion(funnel, "Новый лид", "Заключен договор"),
            color: "hsl(35, 92%, 50%)",
            description: "Сквозная конверсия от лида до сделки",
        },
    ];

    return (
        <Card className={cn(className)}>
            <CardHeader className="px-3 pb-2 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-center text-xl font-semibold text-slate-900 sm:text-left sm:text-3xl">Конверсии</CardTitle>
                        <p className="mt-1 text-center text-sm font-medium text-slate-700 sm:text-left sm:text-base">
                            Процент лидов, перешедших на следующий шаг воронки.
                        </p>
                    </div>
                    {onViewNetwork && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20"
                            onClick={onViewNetwork}
                        >
                            Сеть
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 px-2 pt-1 sm:px-6">
                <div className="overflow-hidden">
                    <ChartContainer config={chartConfig} className="h-[360px] w-full">
                        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 20, bottom: 8 }}>
                            <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="label"
                                width={200}
                                tickLine={false}
                                axisLine={false}
                                tick={<ConversionAxisTick />}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        formatter={(value, _name, item) => {
                                            const row = item?.payload as ConversionItem | undefined;
                                            return (
                                                <div className="w-full space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-muted-foreground">{row?.label ?? "Конверсия"}</span>
                                                        <span className="font-medium tabular-nums">{Number(value)}%</span>
                                                    </div>
                                                    {row?.description && (
                                                        <p className="text-[11px] text-muted-foreground">{row.description}</p>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                }
                            />
                            <Bar dataKey="value" radius={6}>
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    formatter={(value) => `${value ?? 0}%`}
                                    className="fill-slate-900 text-[16px] font-semibold"
                                />
                                {data.map((item) => (
                                    <Cell key={item.key} fill={item.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
                    {data.map((item) => (
                        <div key={item.key} className="rounded-lg border bg-muted/20 px-3 py-2.5 sm:px-3.5 sm:py-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3" style={{ backgroundColor: item.color }} />
                                    <span className="text-base font-medium text-slate-700 break-words">{item.label}</span>
                                </div>
                                <span className="shrink-0 text-xl font-bold leading-none text-slate-900 tabular-nums">{item.value}%</span>
                            </div>
                            <p className="mt-1 text-sm leading-snug text-slate-700">{item.description}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
