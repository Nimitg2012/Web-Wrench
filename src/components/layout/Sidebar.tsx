import { Activity, AlertTriangle, Globe, GraduationCap, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Wrench, X } from '../ui/icons.tsx'
import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/context.ts'
import { cx } from '../../utils/cx.ts'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/websites', label: 'My Websites', icon: Globe, end: false },
  { to: '/monitoring', label: 'Monitoring', icon: Activity, end: false },
  { to: '/issues', label: 'Issues', icon: AlertTriangle, end: false },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles, end: false },
  { to: '/tutorial', label: 'Tutorial', icon: GraduationCap, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function Sidebar({ mobileOpen, onNavigate }: { mobileOpen: boolean; onNavigate: () => void }) {
  const { state, toggleSidebar, profile, mode } = useApp()
  const collapsed = state.sidebarCollapsed && !mobileOpen
  const initial = (profile.name.trim()[0] || 'Y').toUpperCase()

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-midnight/70 md:hidden" onClick={onNavigate} /> : null}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-line bg-sidebar transition-transform md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed && 'md:w-[76px]',
        )}
      >
        <div className={cx('flex items-center gap-3 px-4 py-5', collapsed && 'md:justify-center md:px-2')}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-panel text-cyan shadow-glow">
            <Wrench className="h-5 w-5" />
          </span>
          <span className={cx('min-w-0', collapsed && 'md:hidden')}>
            <span className="block text-sm font-semibold tracking-tight">Web Wrench</span>
            <span className="block text-xs text-muted">Under watch</span>
          </span>
          <button type="button" className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line md:hidden" aria-label="Close menu" onClick={onNavigate}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-panel hover:text-ink',
                    isActive && 'bg-panel text-ink shadow-[inset_3px_0_0_#64D8F5]',
                    collapsed && 'md:justify-center md:px-0',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cx(collapsed && 'md:hidden')}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="space-y-2 border-t border-line p-3">
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={cx('flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-panel', collapsed && 'md:justify-center')}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel-2 text-xs font-semibold text-cyan">{initial}</span>
            <span className={cx('min-w-0', collapsed && 'md:hidden')}>
              <span className="block truncate font-medium">{profile.name.trim() || 'Your account'}</span>
              <span className="block text-xs text-muted">{mode === 'beginner' ? 'Beginner mode' : 'Advanced mode'}</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={toggleSidebar}
            className={cx('hidden min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-muted hover:bg-panel hover:text-ink md:flex', collapsed && 'justify-center')}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            <span className={cx(collapsed && 'md:hidden')}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  )
}
