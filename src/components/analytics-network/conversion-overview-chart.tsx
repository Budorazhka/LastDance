"use client";
// [DOC-RU]
// Если ты меняешь этот файл, оставляй график и расшифровку читаемыми:
// пользователь должен сразу понимать, от какого этапа к какому считается процент.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { FunnelBoard } from "@/types/analytics";
import type { SVGProps } from "react";

interface ConversionOverviewChartProps {
    funnel: FunnelBoard;
    className?: string;
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
        <text x={Number(x) - 4} y={Number(y) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
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

export function ConversionOverviewChart({ funnel, className }: ConversionOverviewChartProps) {
    const data: ConversionItem[] = [
        {
            key: "leadToPresentation",
            label: "Лид → Презентация",
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
            <CardHeader className="px-2 pb-2 sm:px-6">
                <CardTitle className="text-center text-sm font-medium sm:text-lg">Конверсии</CardTitle>
                <p className="text-center text-[11px] text-muted-foreground sm:text-xs">
                    Процент лидов, перешедших на следующий шаг воронки.
                </p>
            </CardHeader>
            <CardContent className="space-y-4 px-1 pt-1 sm:px-6">
                <div className="overflow-hidden origin-top [transform:scale(0.82)] -mb-[54px] sm:[transform:none] sm:mb-0">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
                            <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                fontSize={10}
                            />
                            <YAxis
                                type="category"
                                dataKey="label"
                                width={136}
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
                                                        <span className="font-mono font-medium">{Number(value)}%</span>
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
                                    className="fill-foreground text-[11px]"
                                />
                                {data.map((item) => (
                                    <Cell key={item.key} fill={item.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    {data.map((item) => (
                        <div key={item.key} className="rounded-md border bg-muted/20 px-2.5 py-1.5 sm:px-3 sm:py-2">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: item.color }} />
                                    <span className="truncate text-[11px] text-muted-foreground sm:text-xs">{item.label}</span>
                                </div>
                                <span className="text-[11px] font-medium tabular-nums sm:text-xs">{item.value}%</span>
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:mt-1 sm:text-[11px]">{item.description}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
