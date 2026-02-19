import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { DashboardProvider } from '@/context/DashboardContext'
import App from './App'
import { OverviewPage } from '@/components/overview/OverviewPage'
import { CityPage } from '@/components/city/CityPage'
import { SupremeOwnerDashboardPage } from '@/components/owner/SupremeOwnerDashboardPage'
import { RuntimeErrorBoundary } from '@/components/common/RuntimeErrorBoundary'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardProvider>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<OverviewPage />} />
            <Route path="city/:cityId" element={<CityPage />} />
            <Route
              path="city/:cityId/partner/:partnerId"
              element={
                <RuntimeErrorBoundary>
                  <SupremeOwnerDashboardPage />
                </RuntimeErrorBoundary>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </DashboardProvider>
  </StrictMode>,
)
