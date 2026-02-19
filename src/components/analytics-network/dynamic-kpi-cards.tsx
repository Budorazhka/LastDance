// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: карточки динамических KPI за период; если ты добавляешь метрику, добавь ее и в типы, и в источник данных.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    UserPlus,
    UserCheck,
    Phone,
    MessageCircle,
    LayoutList,
    Trophy,
    Home,
    Users,
} from "lucide-react";
import type { DynamicKpi } from "@/types/analytics";

interface DynamicKpiCardsProps {
    data: DynamicKpi;
    todayData?: DynamicKpi;
    periodLabel: string;
    variant?: "full" | "directOnly";
}

const fullKpiConfig = [
    {
        key: "addedListings" as const,
        label: "Новые объекты",
        icon: Home,
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-500/10",
    },
    {
        key: "addedLeads" as const,
        label: "Новые лиды",
        icon: UserCheck,
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-500/10",
    },
    {
        key: "addedLevel1Referrals" as const,
        label: "Добавлено рефералов L1",
        icon: UserPlus,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-500/10",
    },
    {
        key: "addedLevel2Referrals" as const,
        label: "Добавлено рефералов L2",
        icon: Users,
        iconColor: "text-indigo-500",
        iconBg: "bg-indigo-500/10",
    },
    {
        key: "callClicks" as const,
        label: "Звонки",
        icon: Phone,
        iconColor: "text-orange-500",
        iconBg: "bg-orange-500/10",
    },
    {
        key: "chatOpens" as const,
        label: "Чаты",
        icon: MessageCircle,
        iconColor: "text-cyan-500",
        iconBg: "bg-cyan-500/10",
    },
    {
        key: "selectionsCreated" as const,
        label: "Рассылки",
        icon: LayoutList,
        iconColor: "text-pink-500",
        iconBg: "bg-pink-500/10",
    },
    {
        key: "deals" as const,
        label: "Сделки",
        icon: Trophy,
        iconColor: "text-amber-500",
        iconBg: "bg-amber-500/10",
    },
];

const directOnlyKpiKeys: (keyof DynamicKpi)[] = [
    "addedListings",
    "addedLeads",
    "callClicks",
    "chatOpens",
    "selectionsCreated",
    "deals",
];

export function DynamicKpiCards({ data, todayData, periodLabel, variant = "full" }: DynamicKpiCardsProps) {
    const kpiConfig =
        variant === "directOnly"
            ? fullKpiConfig.filter((kpi) => directOnlyKpiKeys.includes(kpi.key))
            : fullKpiConfig;
    const periodLabelLower = periodLabel.toLocaleLowerCase("ru-RU");

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-muted-foreground">Период:</h3>
                <Badge variant="secondary" className="text-xs">
                    {periodLabel}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {kpiConfig.map((kpi) => {
                    const Icon = kpi.icon;
                    const value = data[kpi.key];
                    const todayValue = todayData?.[kpi.key] ?? 0;

                    return (
                        <Card key={kpi.key} className="p-3">
                            <CardContent className="p-0 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-teal-400/10 text-teal-600 dark:text-teal-400 shadow-none text-[11px]">
                                        +{todayValue.toLocaleString("ru-RU")} за сегодня
                                    </Badge>
                                    <div className={`p-1.5 rounded-md ${kpi.iconBg}`}>
                                        <Icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-foreground">{value.toLocaleString("ru-RU")}</p>
                                    <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                                    <p className="text-[11px] text-muted-foreground/80">за {periodLabelLower}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

