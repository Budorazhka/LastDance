import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'

export default function App() {
  const location = useLocation()
  const isLeads = location.pathname === '/leads' || location.pathname.startsWith('/leads/')

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar isLeadsActive={isLeads} />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
