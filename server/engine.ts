import { createHash } from 'node:crypto'

export type Frequency = '1m' | '5m' | '15m' | '1h' | '6h' | '24h'
export type MonitorState = 'operational' | 'degraded' | 'down' | 'unknown' | 'paused'
export type IssueStatus = 'active' | 'reviewed' | 'resolved'
export type Severity = 'warning' | 'critical'

export const SLOW_MS = 3000
export const FAILURES_BEFORE_DOWN = 2
export const MIN_CHECKS_FOR_UPTIME = 2
export const MAX_LINKS = 12
export const MAX_CHECKS = 180

export interface Probe {
  ok: boolean
  httpStatus: number | null
  responseTimeMs: number | null
  error: string | null
  confirmed: boolean
  finalUrl: string
}

export interface CheckRecord {
  id: string
  websiteId: string
  kind: 'uptime' | 'page' | 'link'
  url: string
  at: string
  ok: boolean
  httpStatus: number | null
  responseTimeMs: number | null
  error: string | null
  confirmed: boolean
}

export interface TrackedIssue {
  id: string
  fingerprint: string
  websiteId: string
  title: string
  pageName: string
  pagePath: string
  severity: Severity
  status: IssueStatus
  category: 'uptime' | 'link' | 'page'
  detectedAt: string
  lastSeenAt: string
  description: string
  whatHappened: string
  currentStatus: string
  investigation: string[]
  observed: string
  expected: string
  monitoringResult: string
  technical: Array<{ label: string; value: string }>
}

export function frequencyMs(frequency: string) {
  if (frequency === '1m') return 60_000
  if (frequency === '5m') return 5 * 60_000
  if (frequency === '1h') return 60 * 60_000
  if (frequency === '6h') return 6 * 60 * 60_000
  if (frequency === '24h') return 24 * 60 * 60_000
  return 15 * 60_000
}

export function isFrequency(value: string): value is Frequency {
  return value === '1m' || value === '5m' || value === '15m' || value === '1h' || value === '6h' || value === '24h'
}

export function issueIdFor(fingerprint: string) {
  const digest = createHash('sha256').update(fingerprint).digest('hex').slice(0, 20)
  return `issue-${digest}`
}

export function addressKey(value: string) {
  try {
    const url = new URL(value)
    url.hash = ''
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')
    return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${url.search}`
  } catch {
    return value
  }
}

function isTemplateHref(raw: string) {
  if (raw.includes('${')) return true
  try {
    return decodeURIComponent(raw).includes('${')
  } catch {
    return false
  }
}

export function extractLinks(html: string, base: string) {
  const document = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  const found: string[] = []
  const seen = new Set<string>()
  const pattern = /href\s*=\s*["']([^"']+)["']/gi
  for (const match of document.matchAll(pattern)) {
    if (found.length >= MAX_LINKS) break
    const raw = match[1]?.trim() ?? ''
    if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(raw) || isTemplateHref(raw)) continue
    let url: URL
    try {
      url = new URL(raw, base)
    } catch {
      continue
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue
    url.hash = ''
    const key = url.toString()
    if (seen.has(key)) continue
    seen.add(key)
    found.push(key)
  }
  return found
}

export function nextMonitorState(previousFailures: number, probe: Probe): { failures: number; state: MonitorState } {
  if (!probe.ok) {
    const failures = previousFailures + 1
    return { failures, state: failures >= FAILURES_BEFORE_DOWN ? 'down' : 'degraded' }
  }
  if ((probe.responseTimeMs ?? 0) >= SLOW_MS) return { failures: 0, state: 'degraded' }
  return { failures: 0, state: 'operational' }
}

export function uptimePercent(checks: CheckRecord[]) {
  const samples = checks.filter((check) => check.kind === 'uptime')
  if (samples.length < MIN_CHECKS_FOR_UPTIME) return null
  const up = samples.filter((check) => check.ok).length
  return Math.round((up / samples.length) * 1000) / 10
}

export function applyProbeIssue(
  issues: TrackedIssue[],
  input: {
    fingerprint: string
    websiteId: string
    title: string
    pageName: string
    pagePath: string
    severity: Severity
    category: TrackedIssue['category']
    at: string
    observed: string
    expected: string
    monitoringResult: string
    technical: Array<{ label: string; value: string }>
    investigation: string[]
    active: boolean
  },
) {
  const current = issues.find((issue) => issue.fingerprint === input.fingerprint && issue.status !== 'resolved')
  if (!input.active) {
    if (!current) return issues
    return issues.map((issue) =>
      issue.id === current.id
        ? { ...issue, status: 'resolved' as const, lastSeenAt: input.at, currentStatus: 'Recovered. A later check no longer saw this problem.' }
        : issue,
    )
  }
  if (current) {
    return issues.map((issue) =>
      issue.id === current.id
        ? {
            ...issue,
            lastSeenAt: input.at,
            status: issue.status === 'reviewed' ? 'reviewed' as const : 'active' as const,
            severity: input.severity,
            observed: input.observed,
            monitoringResult: input.monitoringResult,
            technical: input.technical,
            currentStatus: 'Still happening on the latest check.',
          }
        : issue,
    )
  }
  const created: TrackedIssue = {
    id: issueIdFor(input.fingerprint),
    fingerprint: input.fingerprint,
    websiteId: input.websiteId,
    title: input.title,
    pageName: input.pageName,
    pagePath: input.pagePath,
    severity: input.severity,
    status: 'active',
    category: input.category,
    detectedAt: input.at,
    lastSeenAt: input.at,
    description: input.observed,
    whatHappened: input.observed,
    currentStatus: 'Detected by a stored check.',
    investigation: input.investigation,
    observed: input.observed,
    expected: input.expected,
    monitoringResult: input.monitoringResult,
    technical: input.technical,
  }
  return [...issues, created]
}

export function pruneChecks(checks: CheckRecord[], websiteId: string) {
  const own = checks.filter((check) => check.websiteId === websiteId)
  const rest = checks.filter((check) => check.websiteId !== websiteId)
  return [...rest, ...own.slice(-MAX_CHECKS)]
}
