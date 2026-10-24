import { Sparkles } from '../components/ui/icons.tsx'
import { Link } from 'react-router-dom'
import { useApp } from '../context/context.ts'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { MonitoringNav } from '../components/monitoring/MonitoringNav.tsx'
import { UptimeChart } from '../components/monitoring/UptimeChart.tsx'
import { Button, Card } from '../components/ui/Button.tsx'
import { EmptyState } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { Timeline } from '../components/ui/Timeline.tsx'
import { Term } from '../components/ui/Overlay.tsx'
import { uptimeReport } from '../services/monitoringService.ts'
import { formatDateTime, formatRelative } from '../utils/format.ts'

export function UptimePage() {
  const { selected, openExplain, mode, updateWebsite } = useApp()
  const report = uptimeReport(selected)
  if (!selected || !report) {
    return <EmptyState icon={<Sparkles className="h-5 w-5" />} title="No website selected" body="Choose a website from the menu to see uptime." />
  }
  if (!selected.isDemo && !selected.features.uptime) {
    return (
      <FeatureOff
        title="Uptime checks are off"
        body="Turn uptime checks on to include this website in the server schedule."
        onEnable={() => updateWebsite(selected.id, { features: { ...selected.features, uptime: true } })}
      />
    )
  }
  const explain = () => {
    if (selected.isDemo) {
      openExplain({
        source: 'demo',
        title: 'Uptime report',
        monitoringResult: 'Simulated 30-day uptime is 99.9%. The homepage is responding. One resolved outage lasted 43 minutes.',
        expected: 'The homepage responds to a check.',
        observed: 'The latest simulated check succeeded in 184 ms.',
        technical: 'Demo response 184 ms. Demo HTTP status is not shown as a live result.',
        severity: 'healthy',
        demoExplanation: {
          whatHappened: 'Your website is responding normally in this tutorial.',
          why: ['An earlier simulated outage recovered after 43 minutes.'],
          seriousness: 'Uptime itself is healthy. Other demo issues can still be open.',
          nextSteps: ['Open the incident history if you want the timeline.', 'Do not treat 99.9% as a measurement of a real website.'],
          technical: ['Simulated 30-day uptime: 99.9%', 'Latest simulated response: 184 ms'],
        },
      })
      return
    }
    openExplain({
      source: 'live',
      title: 'Uptime is not being measured',
      monitoringResult: selected.reachability?.message ?? 'No uptime check is stored yet.',
      expected: 'Scheduled checks record availability over time.',
      observed: report?.friendly ?? 'No stored uptime result.',
      technical: `Stored checks: ${selected.checkCount ?? 0}. HTTP ${selected.reachability?.httpStatus ?? 'none'}. Uptime percentage: ${report?.uptimePercent ?? 'not enough history'}.`,
      severity: 'unknown',
    })
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Website uptime</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            <Term tip="How often your website has been available during the selected period.">Uptime</Term> describes how often a site has been available. {report.friendly}
          </p>
        </div>
        <Button variant="ai" onClick={explain}><Sparkles className="h-4 w-4" />Explain with AI</Button>
      </div>
      <ScopeBanner />
      <MonitoringNav />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Current status</p>
          <div className="mt-3"><StatusBadge status={report.status} pulse={report.status === 'healthy'} /></div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Response time</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{report.responseMs === null ? '—' : `${report.responseMs} ms`}</p>
          <p className="text-xs text-muted">{report.simulated ? 'Simulated latest check' : 'Latest stored check'}</p>
        </Card>
        <Card>
          <p className="flex items-center justify-between text-sm text-muted">Uptime {report.simulated ? <DemoTag /> : null}</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{report.uptimePercent === null ? '—' : `${report.uptimePercent}%`}</p>
          <p className="text-xs text-muted">{report.lastCheck ? formatRelative(report.lastCheck) : 'No stored check'}</p>
        </Card>
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Response history</h2>
          {report.simulated ? <DemoTag /> : null}
        </div>
        <p className="mb-3 text-sm text-muted">{report.simulated ? 'Last 24 simulated hours. The gap is the tutorial outage, not a live outage.' : 'Each point is a stored uptime check. Missing points are not filled in.'}</p>
        <UptimeChart data={report.series} />
      </Card>
      <Card>
        <h2 className="font-semibold">Incident history</h2>
        {report.incidents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{report.simulated ? 'No simulated incidents in this view.' : 'No repeated failures are stored. One failed check is not shown as an outage.'}</p>
        ) : (
          <div className="mt-4 space-y-5">
            {report.incidents.map((incident) => (
              <article key={incident.id} className="rounded-xl border border-line bg-midnight p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{incident.title}</h3>
                  <StatusBadge status={incident.status === 'resolved' ? 'healthy' : 'critical'} />
                </div>
                <p className="mt-2 text-sm text-muted">{incident.summary}</p>
                <p className="mt-2 text-xs text-muted">Duration {incident.duration}{incident.recoveredAt ? ` · recovered ${formatRelative(incident.recoveredAt)}` : ''}</p>
                {mode === 'advanced' ? <p className="mt-1 text-xs text-muted">Detected {formatDateTime(incident.startedAt)}{report.simulated ? ' · demo timeline' : ''}</p> : null}
                <div className="mt-4"><Timeline events={incident.events} /></div>
              </article>
            ))}
          </div>
        )}
      </Card>
      {!selected.isDemo && selected.reachability ? (
        <Card>
          <h2 className="font-semibold">Latest stored check</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{selected.reachability.message}</p>
          {mode === 'advanced' ? (
            <p className="mt-2 text-xs text-muted">HTTP {selected.reachability.httpStatus ?? '—'} · {selected.reachability.finalUrl}</p>
          ) : null}
        </Card>
      ) : null}
      <Link to="/issues" className="text-sm text-cyan">Review issues</Link>
    </div>
  )
}

function FeatureOff({ title, body, onEnable }: { title: string; body: string; onEnable: () => void }) {
  return (
    <EmptyState icon={<Sparkles className="h-5 w-5" />} title={title} body={body}>
      <Button onClick={onEnable}>Save this preference</Button>
    </EmptyState>
  )
}
