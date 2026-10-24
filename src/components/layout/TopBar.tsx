import { Bell, ChevronDown, Menu, Plus } from '../ui/icons.tsx'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/context.ts'
import { activeIssueCount } from '../../services/monitoringService.ts'
import { cx } from '../../utils/cx.ts'
import { formatRelative } from '../../utils/format.ts'
import { titleForPath } from './titles.ts'

const popoverClass =
  'z-30 mt-2 rounded-2xl border border-line bg-panel shadow-card max-md:fixed max-md:inset-x-3 max-md:top-[4.25rem] max-md:w-auto md:absolute md:right-0'

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { options, selected, selectWebsite, issues, mode, setMode, profile } = useApp()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [websiteOpen, setWebsiteOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const alerts = issues.filter((issue) => issue.status === 'active')

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setWebsiteOpen(false)
        setAlertsOpen(false)
        setProfileOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWebsiteOpen(false)
        setAlertsOpen(false)
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header ref={rootRef} className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-line bg-midnight/90 px-3 backdrop-blur sm:gap-3 sm:px-6">
      <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-ink md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-4 w-4" />
      </button>
      <div className="hidden min-w-0 flex-1 sm:block">
        <p className="truncate text-sm font-semibold sm:text-base">{titleForPath(pathname)}</p>
      </div>
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <button
          type="button"
          aria-expanded={websiteOpen}
          onClick={() => {
            setWebsiteOpen((open) => !open)
            setAlertsOpen(false)
            setProfileOpen(false)
          }}
          className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm sm:max-w-xs sm:min-h-0"
        >
          <span className="truncate">{selected ? selected.name : 'Select a website'}</span>
          {selected?.isDemo ? <span className="hidden rounded-full bg-purple/15 px-1.5 text-[10px] font-semibold text-purple sm:inline">DEMO</span> : null}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </button>
        {websiteOpen ? (
          <div className={`${popoverClass} md:w-72 p-2`}>
            {options.map((website) => (
              <button
                key={website.id}
                type="button"
                className={cx('flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-panel-2 md:min-h-0', selected?.id === website.id && 'bg-panel-2')}
                onClick={() => {
                  selectWebsite(website.id)
                  setWebsiteOpen(false)
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{website.name}</span>
                  <span className="block truncate text-xs text-muted">{website.url.replace(/^https?:\/\//, '')}</span>
                </span>
                {website.isDemo ? <span className="text-[10px] font-semibold text-purple">DEMO</span> : null}
              </button>
            ))}
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-cyan hover:bg-panel-2"
              onClick={() => {
                setWebsiteOpen(false)
                navigate('/websites/new')
              }}
            >
              <Plus className="h-4 w-4" />
              Add my website
            </button>
          </div>
        ) : null}
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-panel md:h-10 md:w-10"
          onClick={() => {
            setAlertsOpen((open) => !open)
            setWebsiteOpen(false)
            setProfileOpen(false)
          }}
        >
          <Bell className="h-4 w-4" />
          {alerts.length > 0 ? <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger" /> : null}
        </button>
        {alertsOpen ? (
          <div className={`${popoverClass} md:w-80 md:max-w-[80vw] p-3`}>
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Notifications</p>
            {selected?.isDemo ? (
              <p className="mt-2 rounded-lg bg-purple/10 px-2 py-1 text-xs text-purple">Demo alerts. Nothing is sent to you.</p>
            ) : null}
            <div className="mt-2 space-y-1">
              {alerts.length === 0 ? (
                <p className="px-1 py-3 text-sm text-muted">
                  {selected?.isDemo ? 'No simulated alerts.' : 'No open in-app alerts. Email, SMS, and WhatsApp are not sent.'}
                </p>
              ) : (
                alerts.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className="block w-full rounded-xl px-2 py-2 text-left hover:bg-panel-2"
                    onClick={() => {
                      setAlertsOpen(false)
                      navigate(`/issues/${issue.id}`)
                    }}
                  >
                    <span className="block text-sm font-medium">{issue.title}</span>
                    <span className="block text-xs text-muted">{formatRelative(issue.detectedAt)} · {issue.severity}</span>
                  </button>
                ))
              )}
            </div>
            <p className="px-1 pt-2 text-xs text-muted">
              {selected?.isDemo
                ? `${activeIssueCount(issues)} active simulated issues. Nothing is sent to you.`
                : 'Shown here only. Email, SMS, and WhatsApp are not sent.'}
            </p>
          </div>
        ) : null}
      </div>
      <div className="relative">
        <button
          type="button"
          aria-label="Account menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-panel-2 text-sm font-semibold text-cyan md:h-10 md:w-10"
          onClick={() => {
            setProfileOpen((open) => !open)
            setWebsiteOpen(false)
            setAlertsOpen(false)
          }}
        >
          {(profile.name.trim()[0] || 'Y').toUpperCase()}
        </button>
        {profileOpen ? (
          <div className={`${popoverClass} md:w-64 p-3`}>
            <p className="text-sm font-medium">{profile.name.trim() || 'Your account'}</p>
            <p className="text-xs text-muted">{profile.email || 'Saved on this device'}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className={cx('rounded-lg px-2 py-2 text-xs', mode === 'beginner' ? 'bg-cyan text-midnight' : 'bg-panel-2')} onClick={() => setMode('beginner')}>
                Beginner
              </button>
              <button type="button" className={cx('rounded-lg px-2 py-2 text-xs', mode === 'advanced' ? 'bg-cyan text-midnight' : 'bg-panel-2')} onClick={() => setMode('advanced')}>
                Advanced
              </button>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm"
              onClick={() => {
                setProfileOpen(false)
                navigate('/settings')
              }}
            >
              Settings
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
