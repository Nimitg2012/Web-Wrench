import type { ReactNode } from 'react'
import { ArrowRight, GraduationCap, Plus, Sparkles, Wrench } from '../components/ui/icons.tsx'
import { Link } from 'react-router-dom'
import { useApp } from '../context/context.ts'
import { activeIssueCount, dashboardActivity, demoHealth, healthCopy, liveHealthCopy, monitorHealth, openIssues, pageReport, uptimeReport } from '../services/monitoringService.ts'
import type { ExplainRequest, HealthStatus } from '../types/index.ts'
import { buttonClasses, Card, Eyebrow } from '../components/ui/Button.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { Term } from '../components/ui/Overlay.tsx'
import { formatRelative, greeting, STATUS_COLOR } from '../utils/format.ts'

export function Dashboard() {
  const app = useApp()
  const { selected, issues, openExplain, mode } = app
  if (!selected) return <Disconnected onDemo={() => app.selectWebsite('demo')} />

  const demo = selected.isDemo
  const report = uptimeReport(selected)
  const pages = pageReport(selected, app.state.demoSandbox)
  const status: HealthStatus = demo ? demoHealth(issues) : monitorHealth(selected.monitorState)
  const active = activeIssueCount(issues)
  const open = openIssues(issues).length
  const copy = demo ? healthCopy(status, open) : liveHealthCopy(selected, open)
  const activity = dashboardActivity(selected, issues)
  const reachability = selected.reachability
  const uptimeLabel = report?.uptimePercent === null || report?.uptimePercent === undefined ? 'Not enough history' : `${report.uptimePercent}%`

  const explain = () => {
    if (demo) {
      openExplain({
        source: 'demo',
        title: 'Website health',
        monitoringResult: `${copy.headline} Simulated 30-day uptime is 99.9%. ${active} active issues remain in the tutorial data.`,
        expected: 'A store that responds, with checkout, forms, and links reaching their expected pages.',
        observed: copy.summary,
        technical: 'Demo store only. No live probe ran.',
        severity: status,
        demoExplanation: {
          whatHappened: copy.summary,
          why: [
            'The simulated homepage is responding after a resolved 43-minute outage.',
            active > 0 ? 'Checkout, the contact form, or the summer collection link may still be open.' : 'You marked the simulated issues resolved.',
          ],
          seriousness: status === 'healthy' ? 'Nothing in the tutorial needs action right now.' : 'Open issues are practice data. They do not affect a real website.',
          nextSteps: ['Open Issues to review what is still active.', 'Use the tutorial if you want the story from the beginning.'],
          technical: ['Simulated 30-day uptime: 99.9%', 'Latest simulated response: 184 ms', 'No real monitoring alert was sent.'],
        },
      })
      return
    }
    const request: ExplainRequest = {
      source: 'live',
      title: `${selected.name} monitoring`,
      monitoringResult: reachability?.message ?? 'No stored check exists yet. Do not invent uptime or incidents.',
      expected: 'Scheduled checks record availability. Form tests and checkout automation are not running.',
      observed: copy.summary,
      technical: `State ${selected.monitorState ?? 'unknown'}. Stored uptime checks: ${selected.checkCount ?? 0}. Open issues: ${open}. HTTP ${reachability?.httpStatus ?? 'none'}.`,
      severity: 'unknown',
    }
    openExplain(request)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()} 👋</h1>
          <p className="mt-1 text-sm text-muted">Let's check how your website is doing.</p>
        </div>
        {demo ? <DemoTag /> : null}
      </header>
      {demo ? (
        <p className="rounded-xl border border-purple/30 bg-purple/10 px-4 py-3 text-sm">
          <span className="font-semibold text-purple">DEMO MODE.</span> These are simulated monitoring results. No real website is being monitored.
        </p>
      ) : (
        <p className="rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm text-muted">
          {selected.paused
            ? 'Monitoring is paused. The server will not check this website until you resume it.'
            : reachability
              ? `${reachability.message} Checks continue while this browser is closed, as long as the Web Wrench server is running.`
              : 'The server will run the first check shortly. No result is stored yet.'}
        </p>
      )}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>Website health</Eyebrow>
              <StatusBadge status={status} pulse={status === 'healthy'} />
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{copy.headline}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{copy.summary}</p>
            <dl className="mt-5 grid grid-cols-1 gap-4 text-sm min-[360px]:grid-cols-2 sm:grid-cols-4">
              <Fact label="Last checked" value={formatRelative(report?.lastCheck ?? null)} />
              <Fact label={<Term tip="How often your website has been available during the selected period.">Uptime</Term>} value={demo ? '99.9%' : uptimeLabel} />
              <Fact label="Open issues" value={String(open)} />
              <Fact label="Pages" value={String(pages.length)} />
            </dl>
          </div>
          <HealthRing status={status} value={demo ? 99.9 : report?.uptimePercent ?? null} />
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Uptime" value={demo ? '99.9%' : report?.uptimePercent === null || report?.uptimePercent === undefined ? '—' : `${report.uptimePercent}%`} note={demo ? 'Simulated 30-day availability' : (selected.checkCount ?? 0) < 2 ? 'Need at least two checks' : 'From stored checks'} demo={demo} />
        <Stat label="Active issues" value={String(active)} note={demo ? 'Open in the tutorial data' : 'From stored checks'} demo={demo} />
        <Stat label="Pages monitored" value={String(pages.length)} note={demo ? 'Simulated page list' : 'Checked with the website'} demo={demo} />
        <Stat label="Last check" value={formatRelative(report?.lastCheck ?? null)} note={demo ? 'Simulated homepage check' : selected.frequency ? `Every ${selected.frequency}` : 'Scheduled'} demo={demo} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Website activity</h2>
            {demo ? <DemoTag /> : null}
          </div>
          {activity.length === 0 ? (
            <p className="text-sm leading-6 text-muted">{demo ? 'No tutorial activity is available.' : 'No checks have been stored yet.'}</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <StatusBadge status={item.status} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.pageName}</p>
                    <p className="text-sm text-muted">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                    <p className="text-xs text-muted">{formatRelative(item.timestamp)}</p>
                    <Link to={item.href} className="text-sm font-medium text-cyan">
                      View details
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="h-fit">
          <h2 className="text-base font-semibold">Actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/tutorial" className={buttonClasses('secondary')}>
              <GraduationCap className="h-4 w-4" />
              Initiate tutorial
            </Link>
            <button type="button" className={buttonClasses('ai')} onClick={explain}>
              <Sparkles className="h-4 w-4" />
              Explain with AI
            </button>
            <Link to="/websites/new" className={buttonClasses('primary')}>
              <Plus className="h-4 w-4" />
              Add my website
            </Link>
          </div>
          {mode === 'beginner' ? (
            <p className="mt-4 text-xs leading-5 text-muted">
              Beginner mode keeps the language simple. Switch to Advanced from the profile menu when you want status codes and setup detail.
            </p>
          ) : (
            <p className="mt-4 text-xs leading-5 text-muted">
              Advanced mode is on. Demo status codes stay labeled as simulation. Real websites still have no probe data.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

function Disconnected({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()} 👋</h1>
        <p className="mt-1 text-sm text-muted">Let's check how your website is doing.</p>
      </header>
      <div className="rounded-2xl border border-line bg-panel px-6 py-10 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-panel-2 text-cyan shadow-glow">
          <Wrench className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Your website is not connected yet.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Add a website to save what you want watched, or take the tutorial with a fictional store. The tutorial never contacts a real site.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/websites/new" className={buttonClasses('primary', 'lg')}>
            <Plus className="h-4 w-4" />
            Add my website
          </Link>
          <Link to="/tutorial" className={buttonClasses('secondary', 'lg')}>
            <GraduationCap className="h-4 w-4" />
            Initiate tutorial
          </Link>
        </div>
        <button type="button" className="mt-4 text-sm text-cyan" onClick={onDemo}>
          Explore the demo dashboard
          <ArrowRight className="ml-1 inline h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}

function Stat({ label, value, note, demo }: { label: string; value: string; note: string; demo: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {demo ? <DemoTag /> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{note}</p>
    </Card>
  )
}

function HealthRing({ status, value }: { status: HealthStatus; value: number | null }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dash = value === null ? 0 : (value / 100) * circumference
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-32 w-32 shrink-0" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} stroke="#223247" strokeWidth="8" fill="none" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={STATUS_COLOR[status]}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="58" textAnchor="middle" fill="#F1F5FA" fontSize="16" fontWeight="600">
        {value === null ? '—' : `${value}%`}
      </text>
      <text x="60" y="76" textAnchor="middle" fill="#98A9BD" fontSize="9">
        uptime
      </text>
    </svg>
  )
}
