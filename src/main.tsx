import { type ReactNode, Component, StrictMode } from 'react'
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

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('RootErrorBoundary:', error)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 560 }}>
          <h2 style={{ color: '#b91c1c' }}>Ошибка загрузки приложения</h2>
          <p style={{ marginTop: 8, color: '#374151' }}>{this.state.error.message}</p>
          <p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
            Откройте консоль браузера (F12 → Console), чтобы увидеть подробности.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
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
    </RootErrorBoundary>
  </StrictMode>,
)
