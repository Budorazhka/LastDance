import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { hasLeadAdminAccess } from '@/lib/portal-user'
import { LeadCloudTab } from './LeadCloudTab'
import { LeadSettingsTab } from './LeadSettingsTab'
import { LeadManagersTab } from './LeadManagersTab'
import { LeadPartnersTab } from './LeadPartnersTab'
import { LeadSourcesTab } from './LeadSourcesTab'
import { LeadAnalyticsTab } from './LeadAnalyticsTab'

export function LeadsAdminPage() {
  const navigate = useNavigate()
  const hasAccess = hasLeadAdminAccess()

  if (!hasAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white px-10 py-12 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <ShieldX className="size-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Нет доступа</h2>
            <p className="text-sm text-slate-600">
              У вас нет прав для просмотра раздела «Контроль лидов».
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="default" className="rounded-full px-6">
            На главную
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Header
        title="Контроль лидов"
        breadcrumbs={[{ label: 'Обзор', href: '/' }, { label: 'Контроль лидов' }]}
      />
      <Tabs defaultValue="cloud" className="w-full">
        <div className="flex flex-wrap items-center gap-3">
          <TabsList className="inline-flex h-auto rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <TabsTrigger
              value="cloud"
              className="rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-900"
            >
              Облако лидов
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-900"
            >
              Настройки
            </TabsTrigger>
            <TabsTrigger
              value="managers"
              className="rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-900"
            >
              Менеджеры
            </TabsTrigger>
            <TabsTrigger
              value="partners"
              className="rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-900"
            >
              Партнёры по email
            </TabsTrigger>
            <TabsTrigger
              value="sources"
              className="rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-900"
            >
              Источник лидов
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-full border-0 px-4 py-2 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-900"
            >
              Аналитика
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="cloud" className="mt-6">
          <LeadCloudTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <LeadSettingsTab />
        </TabsContent>
        <TabsContent value="managers" className="mt-6">
          <LeadManagersTab />
        </TabsContent>
        <TabsContent value="partners" className="mt-6">
          <LeadPartnersTab />
        </TabsContent>
        <TabsContent value="sources" className="mt-6">
          <LeadSourcesTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <LeadAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
