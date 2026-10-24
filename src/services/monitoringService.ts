import {
  activityFrom,
  DEMO_CHECKED_AT,
  DEMO_CHECKOUT_STEPS,
  DEMO_FORMS,
  DEMO_INCIDENTS,
  DEMO_ISSUES,
  DEMO_LINKS,
  DEMO_PAGES,
  demoUptimeSeries,
} from '../data/demoData.ts'
import type {
  CheckoutSetup,
  DemoSandbox,
  FormSnapshot,
  HealthStatus,
  Issue,
  IssueStatus,
  MonitorState,
  PageSnapshot,
  Severity,
  Website,
} from '../types/index.ts'

export function applyIssueStates(issues: Issue[], states: Record<string, Issue['status']>) {
  return issues.map((issue) => ({ ...issue, status: states[issue.id] ?? issue.status }))
}

export function openIssues(issues: Issue[]) {
  return issues.filter((issue) => issue.status !== 'resolved')
}

export function demoHealth(issues: Issue[]): HealthStatus {
  const open = openIssues(issues)
  if (open.some((issue) => issue.severity === 'critical')) return 'critical'
  if (open.some((issue) => issue.severity === 'warning')) return 'warning'
  return 'healthy'
}

export function healthCopy(status: HealthStatus, activeCount: number) {
  if (status === 'healthy') {
    return {
      headline: 'Everything looks good.',
      summary: 'Your website is online and your latest checks passed.',
    }
  }
  if (status === 'critical') {
    return {
      headline: 'A critical issue needs attention.',
      summary: 'Your website is online in this demo, but a critical simulated problem is still open.',
    }
  }
  if (status === 'warning') {
    return {
      headline: 'Something needs a look.',
      summary: `Your website is online, with ${activeCount} open simulated issue${activeCount === 1 ? '' : 's'} to review.`,
    }
  }
  return {
    headline: 'Website added. Monitoring service is not connected yet.',
    summary: 'Web Wrench has not started continuous checks, so there is no live health result.',
  }
}

export function monitorHealth(state: MonitorState | undefined): HealthStatus {
  if (state === 'operational') return 'healthy'
  if (state === 'degraded') return 'warning'
  if (state === 'down') return 'critical'
  return 'unknown'
}

export function liveHealthCopy(website: Website, openCount: number) {
  if (website.paused || website.monitorState === 'paused') {
    return { headline: 'Monitoring is paused.', summary: 'Checks will not run until you resume this website.' }
  }
  if ((website.checkCount ?? 0) === 0) {
    return { headline: 'Uptime monitoring is on.', summary: 'The first stored check has not finished. The server keeps checking while this page is closed.' }
  }
  if ((website.checkCount ?? 0) === 1) {
    return { headline: 'Uptime monitoring is on.', summary: 'One check is stored. The percentage appears after the next check. Each result stays in the history.' }
  }
  if (website.monitorState === 'down') {
    return { headline: 'The website looks down.', summary: 'At least two stored checks in a row failed. A single failure is not treated as an outage.' }
  }
  if (website.monitorState === 'degraded') {
    return { headline: 'Something needs a look.', summary: openCount > 0 ? `${openCount} open issue${openCount === 1 ? '' : 's'} came from stored checks.` : 'The latest stored check was slow or failed once.' }
  }
  if (website.monitorState === 'operational') {
    return { headline: 'The latest check succeeded.', summary: (website.checkCount ?? 0) < 2 ? 'Uptime needs at least two stored checks before a percentage is shown.' : 'Uptime on the dashboard is calculated from stored checks only.' }
  }
  return { headline: 'Waiting for a stored check.', summary: 'No monitoring result has been saved yet.' }
}

export function dashboardActivity(website: Website | null, issues: Issue[]) {
  if (!website) return []
  if (!website.isDemo) return website.activity ?? []
  return activityFrom(issues)
}

export function uptimeReport(website: Website | null) {
  if (!website) return null
  if (!website.isDemo) {
    const enough = (website.checkCount ?? 0) >= 2
    return {
      simulated: false,
      status: monitorHealth(website.monitorState),
      responseMs: website.reachability?.responseTimeMs ?? null,
      uptimePercent: enough ? website.uptimePercent ?? null : null,
      lastCheck: website.reachability?.checkedAt ?? null,
      series: website.series ?? [],
      incidents: website.incidents ?? [],
      friendly: website.paused
        ? 'Monitoring is paused, so no new checks are being stored.'
        : (website.checkCount ?? 0) === 0
          ? 'The server has not stored a check yet.'
          : enough
            ? 'Uptime is the share of stored uptime checks that succeeded.'
            : 'One check is stored. A percentage appears after a second check.',
    }
  }
  return {
    simulated: true,
    status: 'healthy' as const,
    responseMs: 184,
    uptimePercent: 99.9,
    lastCheck: DEMO_CHECKED_AT,
    series: demoUptimeSeries(),
    incidents: DEMO_INCIDENTS,
    friendly: 'Your website is responding normally.',
  }
}

export function linkReport(website: Website | null) {
  if (!website) return []
  if (!website.isDemo) return website.links ?? []
  return DEMO_LINKS
}

export function pageReport(website: Website | null, sandbox: DemoSandbox): PageSnapshot[] {
  if (!website) return []
  if (website.isDemo) {
    const simulated = DEMO_PAGES.filter((page) => !sandbox.hiddenPageIds.includes(page.id)).map((page) => ({
      ...page,
      frequency: sandbox.pageFrequency[page.id] ?? page.frequency,
    }))
    const extra = sandbox.extraPages.map((page) => ({
      id: page.id,
      name: page.name,
      path: page.path,
      frequency: page.frequency,
      status: 'unknown' as const,
      detail: 'Added in the demo. This page is not being monitored.',
      lastChecked: null,
      simulated: false,
    }))
    return [...simulated, ...extra]
  }
  if (!website.features.pages) return []
  return website.pages.map((page) => ({
    id: page.id,
    name: page.name,
    path: page.path,
    frequency: page.frequency,
    status: page.status ?? 'unknown',
    detail: page.detail ?? 'Not checked yet.',
    lastChecked: page.lastChecked ?? null,
    simulated: false,
  }))
}

export function formReport(website: Website | null, sandbox: DemoSandbox): FormSnapshot[] {
  if (!website) return []
  if (website.isDemo) {
    const simulated = DEMO_FORMS.filter((form) => !sandbox.removedFormIds.includes(form.id))
    const extra = sandbox.extraForms.map((form) => ({
      ...form,
      status: 'unknown' as const,
      lastTest: null,
      result: 'Not tested. This demo form is configuration only.',
      observed: ['No test has been run.'],
      possibleCauses: [],
      simulated: false,
    }))
    return [...simulated, ...extra]
  }
  if (!website.features.forms) return []
  return website.forms.map((form) => ({
    ...form,
    status: 'unknown' as const,
    lastTest: null,
    result: 'Not tested. Form monitoring is not connected.',
    observed: ['No test has been run.'],
    possibleCauses: [],
    simulated: false,
  }))
}

export function checkoutView(website: Website | null) {
  if (!website?.isDemo) {
    return { simulated: false, steps: [] as typeof DEMO_CHECKOUT_STEPS, summary: '' }
  }
  return {
    simulated: true,
    steps: DEMO_CHECKOUT_STEPS,
    summary: 'Web Wrench detected that the checkout workflow did not complete successfully.',
  }
}

const UNSAVED_CHECKOUT: CheckoutSetup = {
  environmentUrl: '',
  testAccountLabel: '',
  steps: ['Product page', 'Cart', 'Checkout', 'Confirmation'],
}

export function checkoutSetup(website: Website | null, sandbox: DemoSandbox): CheckoutSetup {
  if (!website) return UNSAVED_CHECKOUT
  if (website.isDemo) return sandbox.checkout
  return website.checkout
}

export function activeIssueCount(issues: Issue[]) {
  return issues.filter((issue) => issue.status === 'active').length
}

export function filterIssues(
  issues: Issue[],
  query: string,
  status: 'all' | IssueStatus,
  severity: 'all' | Severity,
  sort: 'newest' | 'oldest' | 'severity',
) {
  const rank = { critical: 0, warning: 1 }
  const needle = query.trim().toLowerCase()
  return issues
    .filter((issue) => {
      const haystack = `${issue.title} ${issue.pageName} ${issue.description}`.toLowerCase()
      if (!haystack.includes(needle)) return false
      if (status !== 'all' && issue.status !== status) return false
      if (severity !== 'all' && issue.severity !== severity) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'severity') return rank[a.severity] - rank[b.severity]
      const delta = new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
      return sort === 'oldest' ? delta : -delta
    })
}

export const baseIssues = DEMO_ISSUES
