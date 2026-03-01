import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardProvider } from '@/context/DashboardContext'
import { LeadsProvider } from '@/context/LeadsContext'
import App from './App'
import { OverviewPage } from '@/components/overview/OverviewPage'
import { CityPage } from '@/components/city/CityPage'
import { CityMailingsPage } from '@/components/city/CityMailingsPage'
import { SupremeOwnerDashboardPage } from '@/components/owner/SupremeOwnerDashboardPage'
import { LeadsAdminPage } from '@/components/leads/LeadsAdminPage'
import { RuntimeErrorBoundary } from '@/components/common/RuntimeErrorBoundary'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardProvider>
      <LeadsProvider>
        <HashRouter>
          <Routes>
            <Route element={<App />}>
              <Route index element={<OverviewPage />} />
              <Route path="city/:cityId" element={<CityPage />} />
              <Route path="city/:cityId/mailings" element={<CityMailingsPage />} />
              <Route
                path="city/:cityId/partner"
                element={
                  <RuntimeErrorBoundary>
                    <SupremeOwnerDashboardPage />
                  </RuntimeErrorBoundary>
                }
              />
              <Route
                path="city/:cityId/partner/:partnerId"
                element={
                  <RuntimeErrorBoundary>
                    <SupremeOwnerDashboardPage />
                  </RuntimeErrorBoundary>
                }
              />
              <Route
                path="leads"
                element={
                  <RuntimeErrorBoundary>
                    <LeadsAdminPage />
                  </RuntimeErrorBoundary>
                }
              />
              <Route path="leads/analytics" element={<Navigate to="/leads" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </LeadsProvider>
    </DashboardProvider>
  </StrictMode>,
)
