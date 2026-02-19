// [DOC-RU]
// Если ты меняешь этот файл, сначала держи прежний смысл метрик и полей, чтобы UI не разъехался.
// Смысл файла: карточки статических KPI (накопительные значения); если ты меняешь подписи, синхронизируй с продуктовой терминологией.
// После правок ты проверяешь экран руками и сверяешь ключевые цифры/периоды.

import { Card, CardContent } from "@/components/ui/card";
import { Users, Home, UserCheck, Handshake } from "lucide-react";
import type { StaticKpi } from "@/types/analytics";

interface StaticKpiCardsProps {
    data: StaticKpi;
    referralsLabel?: string;
    secondMetric?: {
        label: string;
        value: number;
    };
}

function getKpiConfig(referralsLabel: string, secondMetricLabel: string) {
    return [
        {
            key: "level1Referrals" as const,
            label: referralsLabel,
            icon: Users,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-500/10",
        },
        {
            key: "totalListings" as const,
            label: secondMetricLabel,
            icon: Home,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-500/10",
        },
        {
            key: "totalLeads" as const,
            label: "Лиды",
            icon: UserCheck,
            iconColor: "text-amber-500",
            iconBg: "bg-amber-500/10",
        },
        {
            key: "totalDeals" as const,
            label: "Сделки",
            icon: Handshake,
            iconColor: "text-violet-500",
            iconBg: "bg-violet-500/10",
        },
    ];
}

export function StaticKpiCards({ data, referralsLabel = "Рефералы L1", secondMetric }: StaticKpiCardsProps) {
    const kpiConfig = getKpiConfig(referralsLabel, secondMetric?.label ?? "Объекты");

    return (
        <div className="grid grid-cols-2 gap-3">
            {kpiConfig.map((kpi) => {
                const Icon = kpi.icon;
                const value = kpi.key === "totalListings" && secondMetric ? secondMetric.value : data[kpi.key];

                return (
                    <Card key={kpi.key} className="p-3">
                        <CardContent className="p-0 flex flex-col items-center gap-2 text-center">
                            <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
                                <p className="text-lg font-medium">{value.toLocaleString("ru-RU")}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

