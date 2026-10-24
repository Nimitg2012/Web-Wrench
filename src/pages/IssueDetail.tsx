import { Sparkles } from '../components/ui/icons.tsx'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/context.ts'
import { Button, buttonClasses, Card } from '../components/ui/Button.tsx'
import { EmptyState } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import type { Issue } from '../types/index.ts'
import { findIssueByRoute } from '../utils/issueLookup.ts'
import { absolutePageUrl, websiteScope, type LinkScope } from '../utils/url.ts'
import { formatDateTime } from '../utils/format.ts'

export function IssueDetail() {
  const params = useParams()
  const routeId = params['*'] || params.issueId || ''
  const { issueCatalog, options, setIssueStatus, openExplain, mode, toast } = useApp()
  const issue = findIssueByRoute(issueCatalog, routeId)
  const website = options.find((item) => item.id === issue?.websiteId) ?? null

  if (!routeId) {
    return (
      <EmptyState icon={<Sparkles className="h-5 w-5" />} title="Issue not found" body="This address does not include an issue id.">
        <Link to="/issues" className="text-sm font-medium text-cyan">Back to issues</Link>
      </EmptyState>
    )
  }
  if (!issue) {
    return (
      <EmptyState icon={<Sparkles className="h-5 w-5" />} title="Issue not found" body="No stored issue uses this id. It may have been removed, or the address is incomplete.">
        <Link to="/issues" className="text-sm font-medium text-cyan">Back to issues</Link>
      </EmptyState>
    )
  }

  const scope = website ? websiteScope(website.url, issue.pagePath) : 'unknown'
  const destination = website && issue.pagePath ? absolutePageUrl(website.url, issue.pagePath) : null
  const foundOn = fact(issue, 'Found on') || fact(issue, 'Source') || website?.links?.find((link) => link.issueId === issue.id)?.source || ''
  const containingPage = website && foundOn ? absolutePageUrl(website.url, foundOn) : null
  const httpStatus = fact(issue, 'HTTP status')
  const responseTime = fact(issue, 'Response time')
  const broken = isBrokenStatus(httpStatus)
  const template = looksLikeTemplate(issue.pagePath)

  const explain = () => {
    openExplain({
      source: issue.isDemo ? 'demo' : 'live',
      title: issue.title,
      monitoringResult: issue.monitoringResult,
      expected: issue.expected,
      observed: issue.observed,
      technical: issue.technical.map((item) => `${item.label}: ${item.value}`).join('\n'),
      severity: issue.severity === 'critical' ? 'critical' : 'warning',
      demoExplanation: issue.isDemo ? issue.explanation : undefined,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/issues" className="text-sm text-cyan">All issues</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold break-words">{issue.title}</h1>
            {issue.isDemo ? <DemoTag /> : null}
            <ScopeBadge scope={scope} />
          </div>
          <p className="mt-2 text-sm text-muted">{website?.name ?? 'Website not stored on this machine'}</p>
        </div>
        <Button variant="ai" className="max-sm:w-full" onClick={explain}><Sparkles className="h-4 w-4" />Explain with AI</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={issue.severity === 'critical' ? 'critical' : 'warning'} />
        <span className="rounded-full border border-line px-2.5 py-1 text-xs capitalize text-muted">{issue.status}</span>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs capitalize text-muted">{categoryLabel(issue.category)}</span>
      </div>
      {scope === 'external' ? (
        <Card>
          <h2 className="font-semibold">External link</h2>
          <p className="mt-2 text-sm leading-6 text-muted">This destination is on another website. It is not one of the registered site’s pages, and it is not treated as an internal page.</p>
        </Card>
      ) : null}
      {template ? (
        <Card>
          <h2 className="font-semibold">Unrendered template</h2>
          <p className="mt-2 text-sm leading-6 text-muted">This address still contains an unrendered template marker. It was taken from the page source and is not a normal published path. The stored check result is below.</p>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Info title="Website" body={website ? `${website.name} · ${website.url}` : 'Not stored'} />
        <Info title="Affected address" body={issue.pagePath || 'No affected address was stored with this issue.'} />
        <Info title="Issue type" body={categoryLabel(issue.category)} />
        <Info title="Where it sits" body={scopeCopy(scope)} />
        <Info title="HTTP status" body={httpStatus || 'Not stored'} />
        <Info title="Response time" body={responseTime || 'Not stored'} />
        <Info title="First detected" body={formatDateTime(issue.detectedAt)} />
        <Info title="Last detected" body={issue.lastSeenAt ? formatDateTime(issue.lastSeenAt) : 'Not stored separately from the first detection.'} />
      </div>
      <Card>
        <h2 className="font-semibold">What the check recorded</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{issue.monitoringResult || 'No monitoring result was stored.'}</p>
        <p className="mt-3 text-sm leading-6 text-muted">{issue.observed || 'No error detail was stored.'}</p>
        <p className="mt-3 text-sm text-muted">Current status: {issue.currentStatus}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">How can I investigate?</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
          {issue.investigation.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </Card>
      <Card>
        <h2 className="font-semibold">Observed and expected</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <p className="rounded-xl bg-midnight p-3 text-sm"><span className="block text-xs text-muted">Observed</span>{issue.observed}</p>
          <p className="rounded-xl bg-midnight p-3 text-sm"><span className="block text-xs text-muted">Expected</span>{issue.expected}</p>
        </div>
        {mode === 'advanced' ? (
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {issue.technical.map((item) => (
              <div key={item.label} className="rounded-xl border border-line px-3 py-2 text-sm">
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="break-all">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Card>
      <div className="flex flex-wrap gap-2">
        {issue.isDemo ? null : openActions({ issue, scope, broken, destination, containingPage })}
        {issue.status !== 'reviewed' ? (
          <Button className="max-sm:w-full" variant="secondary" onClick={() => { setIssueStatus(issue.id, 'reviewed'); toast(issue.isDemo ? 'Marked as reviewed in this demo.' : 'Marked as reviewed.', 'success') }}>Mark as reviewed</Button>
        ) : (
          <Button className="max-sm:w-full" variant="ghost" onClick={() => { setIssueStatus(issue.id, 'active'); toast(issue.isDemo ? 'Moved back to active.' : 'Moved back to active.', 'info') }}>Move back to active</Button>
        )}
        {issue.status !== 'resolved' ? (
          <Button className="max-sm:w-full" onClick={() => { setIssueStatus(issue.id, 'resolved'); toast(issue.isDemo ? 'Marked resolved in this demo. The real website was not changed.' : 'Marked resolved. The website itself was not changed.', 'success') }}>Mark resolved</Button>
        ) : (
          <Button className="max-sm:w-full" variant="ghost" onClick={() => setIssueStatus(issue.id, 'active')}>Reopen</Button>
        )}
      </div>
    </div>
  )
}

function openActions({
  issue,
  scope,
  broken,
  destination,
  containingPage,
}: {
  issue: Issue
  scope: LinkScope
  broken: boolean
  destination: string | null
  containingPage: string | null
}) {
  if (!issue.pagePath) return null
  if (issue.category === 'link' && broken && containingPage && containingPage !== destination) {
    return (
      <>
        <PageLink href={containingPage}>Open the page that contains this link</PageLink>
        {destination ? <PageLink href={destination}>Open destination in a new tab</PageLink> : null}
      </>
    )
  }
  if (scope === 'external' && destination) {
    return <PageLink href={destination}>Open external link</PageLink>
  }
  if (destination && !broken) {
    return <PageLink href={destination}>Open page</PageLink>
  }
  if (destination && (issue.category === 'uptime' || issue.category === 'page')) {
    return <PageLink href={destination}>Open page</PageLink>
  }
  if (destination && broken) {
    return <PageLink href={destination}>Open destination in a new tab</PageLink>
  }
  return null
}

function PageLink({ href, children }: { href: string; children: string }) {
  return (
    <a className={`${buttonClasses('secondary')} max-sm:w-full`} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function ScopeBadge({ scope }: { scope: LinkScope }) {
  const label = scope === 'external' ? 'External link' : scope === 'internal' ? 'Internal page' : 'Address unchecked'
  return <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{label}</span>
}

function scopeCopy(scope: LinkScope) {
  if (scope === 'internal') return 'On the registered website.'
  if (scope === 'external') return 'External link. Not an internal page.'
  return 'The address could not be compared with the registered website.'
}

function categoryLabel(category: Issue['category']) {
  if (category === 'uptime') return 'Website availability'
  if (category === 'link') return 'Broken link'
  if (category === 'page') return 'Important page'
  if (category === 'form') return 'Form'
  return 'Checkout'
}

function fact(issue: Issue, label: string) {
  return issue.technical.find((item) => item.label === label)?.value ?? ''
}

function isBrokenStatus(value: string) {
  const status = Number(value)
  return Number.isFinite(status) && status >= 400
}

function looksLikeTemplate(value: string) {
  if (!value) return false
  try {
    return decodeURIComponent(value).includes('${')
  } catch {
    return value.includes('${')
  }
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 break-all text-sm leading-6 text-muted">{body}</p>
    </Card>
  )
}
