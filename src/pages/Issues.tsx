import { Search } from '../components/ui/icons.tsx'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { useApp } from '../context/context.ts'
import { filterIssues } from '../services/monitoringService.ts'
import { Card } from '../components/ui/Button.tsx'
import { controlClass, EmptyState } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import type { Issue, IssueStatus, Severity } from '../types/index.ts'
import { formatRelative } from '../utils/format.ts'

type StatusFilter = 'all' | IssueStatus
type SeverityFilter = 'all' | Severity
type Sort = 'newest' | 'oldest' | 'severity'

export function Issues() {
  const { selected, issues } = useApp()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [sort, setSort] = useState<Sort>('newest')

  const counts = {
    active: issues.filter((issue) => issue.status === 'active').length,
    resolved: issues.filter((issue) => issue.status === 'resolved').length,
    warning: issues.filter((issue) => issue.severity === 'warning' && issue.status !== 'resolved').length,
    critical: issues.filter((issue) => issue.severity === 'critical' && issue.status !== 'resolved').length,
  }

  const visible = useMemo(() => filterIssues(issues, query, status, severity, sort), [issues, query, status, severity, sort])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Issues</h1>
        <p className="mt-1 text-sm text-muted">Everything that needs a look, in one place.</p>
      </div>
      <ScopeBanner />
      {!selected ? (
        <EmptyState icon={<Search className="h-5 w-5" />} title="No website selected" body="Open the demo store to practice with simulated issues, or add a website. A new website has no issues until monitoring is connected." />
      ) : issues.length === 0 ? (
        <EmptyState icon={<Search className="h-5 w-5" />} title="No issues yet" body="Issues appear after monitoring is connected. Web Wrench is not reporting a problem for this website." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Count label="Active" value={counts.active} onClick={() => { setStatus('active'); setSeverity('all') }} />
            <Count label="Resolved" value={counts.resolved} onClick={() => { setStatus('resolved'); setSeverity('all') }} />
            <Count label="Warning" value={counts.warning} onClick={() => { setSeverity('warning'); setStatus('all') }} />
            <Count label="Critical" value={counts.critical} onClick={() => { setSeverity('critical'); setStatus('all') }} />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
              <input className={`${controlClass} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" />
            </div>
            <select className={controlClass} value={status} aria-label="Filter by status" onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className={controlClass} value={severity} aria-label="Filter by severity" onChange={(event) => setSeverity(event.target.value as SeverityFilter)}>
              <option value="all">All severities</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <select className={controlClass} value={sort} aria-label="Sort issues" onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="severity">Severity</option>
            </select>
          </div>
          {(query || status !== 'all' || severity !== 'all') ? (
            <button type="button" className="self-start text-sm text-cyan" onClick={() => { setQuery(''); setStatus('all'); setSeverity('all') }}>Clear filters</button>
          ) : null}
          {visible.length === 0 ? (
            <EmptyState icon={<Search className="h-5 w-5" />} title="No issues match" body="Clear the search or filters to see the full demo list." />
          ) : (
            <div className="grid gap-3">
              {visible.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Count({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-line bg-panel p-4 text-left shadow-card hover:border-cyan/40">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </button>
  )
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold break-words">{issue.title}</h2>
            <StatusBadge status={issue.status === 'resolved' ? 'healthy' : issue.severity === 'critical' ? 'critical' : 'warning'} />
            {issue.isDemo ? <DemoTag /> : null}
          </div>
          <p className="mt-2 text-sm break-words text-muted">{issue.description}</p>
          <p className="mt-2 text-xs break-all text-muted">
            {issue.pageName} · {issue.pagePath} · detected {formatRelative(issue.detectedAt)} · {issue.status}
          </p>
        </div>
        <Link to={`/issues/${issue.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-cyan sm:min-h-0">Open</Link>
      </div>
    </Card>
  )
}
