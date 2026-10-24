import { ArrowRight, FileText, Link2, ShoppingCart, SquareMousePointer, Timer } from '../components/ui/icons.tsx'
import { Link } from 'react-router-dom'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { EmptyState } from '../components/ui/Overlay.tsx'
import { StatusBadge } from '../components/ui/Status.tsx'
import { useApp } from '../context/context.ts'
import { activeIssueCount } from '../services/monitoringService.ts'
import type { HealthStatus } from '../types/index.ts'

const FEATURES: Array<{
  to: string
  title: string
  body: string
  icon: typeof Timer
  key: 'uptime' | 'brokenLinks' | 'pages' | 'forms' | 'checkout'
  demoStatus: HealthStatus
  demoNote: string
}> = [
  { to: '/monitoring/uptime', title: 'Website uptime', body: 'See whether your website is responding.', icon: Timer, key: 'uptime', demoStatus: 'healthy', demoNote: 'Responding · 99.9% simulated' },
  { to: '/monitoring/links', title: 'Broken links', body: 'Find links that do not open.', icon: Link2, key: 'brokenLinks', demoStatus: 'warning', demoNote: '1 simulated broken link' },
  { to: '/monitoring/pages', title: 'Important pages', body: 'Choose the pages that matter most.', icon: FileText, key: 'pages', demoStatus: 'warning', demoNote: '12 simulated pages' },
  { to: '/monitoring/forms', title: 'Forms', body: 'Watch for a confirmation after a form is used.', icon: SquareMousePointer, key: 'forms', demoStatus: 'warning', demoNote: 'Contact form needs review' },
  { to: '/monitoring/checkout', title: 'Checkout', body: 'Describe a safe test checkout. No orders are placed.', icon: ShoppingCart, key: 'checkout', demoStatus: 'critical', demoNote: 'Simulated checkout did not finish' },
]

export function Monitoring() {
  const { selected, issues } = useApp()
  if (!selected) {
    return (
      <EmptyState icon={<Timer className="h-5 w-5" />} title="Choose a website first" body="Select the demo store to practice, or add your own website. Live checks are not running.">
        <Link to="/websites" className="text-sm font-medium text-cyan">Go to my websites</Link>
      </EmptyState>
    )
  }
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Monitoring</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          {selected.isDemo
            ? 'Each area below uses the fictional Northwind store. Nothing here is a live probe.'
            : 'Turn features on to save what you want watched. Web Wrench will not invent results before a monitoring service is connected.'}
        </p>
      </div>
      <ScopeBanner />
      <div className="grid gap-3 md:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          const enabled = selected.isDemo || selected.features[feature.key]
          const note = selected.isDemo ? feature.demoNote : enabled ? 'Saved preference · not running' : 'Turned off in setup'
          return (
            <Link key={feature.to} to={feature.to} className="rounded-2xl border border-line bg-panel p-5 shadow-card transition hover:border-cyan/40">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel-2 text-cyan">
                  <Icon className="h-4 w-4" />
                </span>
                <StatusBadge status={selected.isDemo ? feature.demoStatus : 'unknown'} />
              </div>
              <h2 className="mt-4 font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{feature.body}</p>
              <p className="mt-3 flex items-center justify-between text-sm text-cyan">
                {note}
                <ArrowRight className="h-4 w-4" />
              </p>
            </Link>
          )
        })}
      </div>
      {selected.isDemo ? <p className="text-xs text-muted">{activeIssueCount(issues)} active simulated issues are waiting in the issues center.</p> : null}
    </div>
  )
}
