import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/context.ts'
import { ExplainDrawer } from '../ai/ExplainDrawer.tsx'
import { Sidebar } from './Sidebar.tsx'
import { TopBar } from './TopBar.tsx'
import { titleForPath } from './titles.ts'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { closeExplain } = useApp()

  useEffect(() => {
    setMobileOpen(false)
    closeExplain()
    document.title = `${titleForPath(location.pathname)} · Web Wrench`
  }, [location.pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-transparent text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:rounded-lg focus:bg-cyan focus:px-3 focus:py-2 focus:text-midnight">
        Skip to content
      </a>
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main id="main" className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div key={location.pathname} className="page-enter mx-auto flex w-full max-w-6xl flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
      <ExplainDrawer />
    </div>
  )
}
