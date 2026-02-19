import { Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
