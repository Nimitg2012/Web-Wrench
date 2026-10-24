import { Search } from '../components/ui/icons.tsx'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { MonitoringNav } from '../components/monitoring/MonitoringNav.tsx'
import { useApp } from '../context/context.ts'
import { linkReport } from '../services/monitoringService.ts'
import { Button, Card } from '../components/ui/Button.tsx'
import { controlClass, EmptyState } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { formatRelative } from '../utils/format.ts'

export function BrokenLinks() {
  const { selected, issues, setIssueStatus, toast, mode, updateWebsite } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'broken' | 'ok' | 'redirect' | 'unverified'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const links = linkReport(selected)
  const visible = useMemo(
    () =>
      links.filter((link) => {
        const haystack = `${link.source} ${link.destination} ${link.description}`.toLowerCase()
        const matchesQuery = haystack.includes(query.trim().toLowerCase())
        const matchesFilter = filter === 'all' || link.status === filter
        return matchesQuery && matchesFilter
      }),
    [links, query, filter],
  )

  if (!selected) return <EmptyState icon={<Search className="h-5 w-5" />} title="No website selected" body="Choose the demo store to inspect simulated links." />
  if (!selected.isDemo && !selected.features.brokenLinks) {
    return (
        <EmptyState icon={<Search className="h-5 w-5" />} title="Broken link checks are off" body="Turn link checks on to crawl this website on the server schedule.">
        <Button onClick={() => updateWebsite(selected.id, { features: { ...selected.features, brokenLinks: true } })}>Save this preference</Button>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Broken links</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">A broken link is an address your visitors cannot open. Web Wrench only lists a link as broken when a check says so.</p>
      </div>
      <ScopeBanner />
      <MonitoringNav />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
          <input className={`${controlClass} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search links" />
        </div>
        <select className={`${controlClass} sm:w-48`} value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter links">
          <option value="all">All statuses</option>
          <option value="broken">Broken</option>
          <option value="ok">Reachable</option>
          <option value="redirect">Redirects</option>
          <option value="unverified">Could not verify</option>
        </select>
      </div>
      {links.length === 0 ? (
        <EmptyState icon={<Search className="h-5 w-5" />} title="No link results" body={selected.isDemo ? 'The tutorial has no simulated links in this filter.' : 'A crawl has not stored any links yet. Unverified links are not called broken.'} />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Search className="h-5 w-5" />} title="No links match" body="Try a different word, or show all statuses." />
      ) : (
        <div className="grid gap-3">
          {visible.map((link) => {
            const issue = issues.find((item) => item.id === link.issueId)
            const open = openId === link.id
            return (
              <Card key={link.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 font-medium break-all">{link.destination}</h2>
                      <StatusBadge status={link.status === 'broken' ? 'warning' : link.status === 'unverified' ? 'unknown' : 'healthy'} />
                      {selected.isDemo ? <DemoTag /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">From {link.source}</p>
                    <p className="mt-2 text-sm text-muted">{link.description}</p>
                    <p className="mt-2 text-xs text-muted">Last checked {formatRelative(link.lastChecked)}{mode === 'advanced' ? ` · HTTP ${link.httpStatus ?? 'none'}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setOpenId(open ? null : link.id)}>
                      {open ? 'Hide details' : 'View details'}
                    </Button>
                    {issue ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = issue.status === 'reviewed' ? 'active' : 'reviewed'
                          setIssueStatus(issue.id, next)
                          toast(next === 'reviewed' ? 'Marked as reviewed in the demo.' : 'Moved back to active in the demo.', 'success')
                        }}
                      >
                        {issue.status === 'reviewed' ? 'Move back to active' : 'Mark as reviewed'}
                      </Button>
                    ) : null}
                  </div>
                </div>
                {open ? (
                  <div className="mt-4 rounded-xl border border-line bg-midnight p-4 text-sm">
                    <p><span className="text-muted">Destination.</span> {link.destination}</p>
                    <p className="mt-2"><span className="text-muted">Status.</span> {link.status === 'broken' ? 'Broken link' : link.status === 'redirect' ? 'Redirect' : 'Reachable'}</p>
                    <p className="mt-2 text-muted">{link.description}</p>
                    {issue ? <Link to={`/issues/${issue.id}`} className="mt-3 inline-block text-cyan">Open the issue</Link> : <p className="mt-3 text-muted">{selected.isDemo ? 'This simulated link has no open issue.' : 'This link has no open issue.'}</p>}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
