import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { websiteScope } from '../src/utils/url.ts'
import {
  addressKey,
  applyProbeIssue,
  frequencyMs,
  isFrequency,
  issueIdFor,
  nextMonitorState,
  pruneChecks,
  uptimePercent,
  SLOW_MS,
  type CheckRecord,
  type Frequency,
  type MonitorState,
  type Probe,
  type TrackedIssue,
} from './engine.ts'

export interface SiteRecord {
  id: string
  name: string
  url: string
  addedAt: string
  paused: boolean
  frequency: Frequency
  features: { uptime: boolean; brokenLinks: boolean; pages: boolean; forms: boolean; checkout: boolean }
  pages: Array<{ id: string; name: string; path: string; frequency: Frequency; status?: string; detail?: string; lastChecked?: string | null }>
  forms: Array<{ id: string; name: string; url: string; expectedConfirmation: string; notes: string }>
  checkout: { environmentUrl: string; testAccountLabel: string; steps: string[] }
  consecutiveFailures: number
  monitorState: MonitorState
}

export interface LinkRow {
  id: string
  websiteId: string
  source: string
  destination: string
  status: 'broken' | 'ok' | 'redirect' | 'unverified'
  httpStatus: number | null
  lastChecked: string
  description: string
  issueId?: string
}

interface Database {
  sites: SiteRecord[]
  checks: CheckRecord[]
  links: LinkRow[]
  issues: TrackedIssue[]
}

const FILE = path.join(process.cwd(), 'data', 'monitoring.json')

function empty(): Database {
  return { sites: [], checks: [], links: [], issues: [] }
}

function read(): Database {
  if (usesPostgres()) {
    if (!memory) throw new Error('The monitoring store is not loaded.')
    return memory
  }
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as Partial<Database>
    const db = {
      sites: Array.isArray(parsed.sites) ? parsed.sites : [],
      checks: Array.isArray(parsed.checks) ? parsed.checks : [],
      links: Array.isArray(parsed.links) ? parsed.links : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    }
    alignIssueIds(db)
    return db
  } catch {
    return empty()
  }
}

function alignIssueIds(db: Database) {
  for (const issue of db.issues) {
    issue.id = issueIdFor(issue.fingerprint)
  }
  for (const link of db.links) {
    if (!link.issueId) continue
    link.issueId = issueIdFor(`link:${link.websiteId}:${link.destination}`)
  }
}

function write(db: Database) {
  mkdirSync(path.dirname(FILE), { recursive: true })
  const temporary = `${FILE}.${process.pid}.tmp`
  writeFileSync(temporary, JSON.stringify(db))
  renameSync(temporary, FILE)
}

let memory: Database | null = null
let loading: Promise<void> | null = null

function usesPostgres() {
  return process.env.MONITOR_STORE === 'postgres'
}

async function ensure() {
  if (!usesPostgres() || memory) return
  if (!loading) {
    loading = loadPostgres().finally(() => {
      loading = null
    })
  }
  await loading
}

async function loadPostgres() {
  const { Pool } = await import('pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })
  await pool.query(`CREATE TABLE IF NOT EXISTS monitor_state (id text PRIMARY KEY, document jsonb NOT NULL)`)
  const existing = await pool.query(`SELECT document FROM monitor_state WHERE id = 'main'`)
  const document = existing.rows[0]?.document
  memory = document && typeof document === 'object' ? (document as Database) : empty()
  alignIssueIds(memory)
  await pool.end()
}

async function persist(db: Database) {
  if (!usesPostgres()) {
    write(db)
    return
  }
  memory = db
  const { Pool } = await import('pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  await pool.query(
    `INSERT INTO monitor_state (id, document) VALUES ('main', $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document`,
    [JSON.stringify(db)],
  )
  await pool.end()
}

let queue: Promise<unknown> = Promise.resolve()

export function update<T>(change: (db: Database) => T | Promise<T>) {
  const run = queue.then(async () => {
    await ensure()
    const db = read()
    const result = await change(db)
    await persist(db)
    return result
  })
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function readSnapshot() {
  await ensure()
  return viewAll(read())
}

export function canonicalSiteUrl(value: string) {
  const url = new URL(value)
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')
  return `${url.protocol}//${host}${pathname}`
}

export function createSite(input: {
  id?: string
  name: string
  url: string
  frequency?: string
  features?: Partial<SiteRecord['features']>
  pages?: SiteRecord['pages']
  forms?: SiteRecord['forms']
  checkout?: SiteRecord['checkout']
}) {
  return update((db) => {
    const key = canonicalSiteUrl(input.url)
    const existing = db.sites.find((site) => canonicalSiteUrl(site.url) === key)
    if (existing) return { created: false as const, site: existing }
    const frequency = input.frequency && isFrequency(input.frequency) ? input.frequency : '1m'
    const features = {
      uptime: input.features?.uptime !== false,
      brokenLinks: input.features?.brokenLinks !== false,
      pages: input.features?.pages !== false,
      forms: input.features?.forms === true,
      checkout: input.features?.checkout === true,
    }
    const pages = (input.pages?.length ? input.pages : features.pages ? [{ id: randomUUID(), name: 'Homepage', path: '/', frequency }] : []).slice(0, 30)
    const site: SiteRecord = {
      id: input.id && /^[\w-]{6,80}$/.test(input.id) ? input.id : `site-${randomUUID()}`,
      name: input.name.trim().slice(0, 80) || new URL(input.url).hostname,
      url: input.url,
      addedAt: new Date().toISOString(),
      paused: false,
      frequency,
      features,
      pages,
      forms: (input.forms ?? []).slice(0, 20),
      checkout: input.checkout ?? { environmentUrl: '', testAccountLabel: '', steps: ['Product page', 'Cart', 'Checkout', 'Confirmation'] },
      consecutiveFailures: 0,
      monitorState: 'unknown',
    }
    db.sites.push(site)
    return { created: true as const, site }
  })
}

export function patchSite(
  id: string,
  patch: Partial<Pick<SiteRecord, 'name' | 'paused' | 'frequency' | 'pages' | 'forms' | 'checkout'>> & {
    features?: Partial<SiteRecord['features']>
  },
) {
  return update((db) => {
    const site = db.sites.find((item) => item.id === id)
    if (!site) return null
    if (typeof patch.name === 'string' && patch.name.trim()) site.name = patch.name.trim().slice(0, 80)
    if (typeof patch.paused === 'boolean') {
      site.paused = patch.paused
      site.monitorState = patch.paused ? 'paused' : site.monitorState === 'paused' ? 'unknown' : site.monitorState
    }
    if (patch.frequency && isFrequency(patch.frequency)) site.frequency = patch.frequency
    if (patch.features) site.features = { ...site.features, ...patch.features }
    if (patch.pages) site.pages = patch.pages.slice(0, 30)
    if (patch.forms) site.forms = patch.forms.slice(0, 20)
    if (patch.checkout) site.checkout = patch.checkout
    return site
  })
}

export function deleteSite(id: string) {
  return update((db) => {
    const before = db.sites.length
    db.sites = db.sites.filter((site) => site.id !== id)
    db.checks = db.checks.filter((check) => check.websiteId !== id)
    db.links = db.links.filter((link) => link.websiteId !== id)
    db.issues = db.issues.filter((issue) => issue.websiteId !== id)
    return db.sites.length !== before
  })
}

export function setIssueStatus(id: string, status: TrackedIssue['status']) {
  return update((db) => {
    const issue = db.issues.find((item) => item.id === id || item.fingerprint === id)
    if (!issue) return null
    issue.status = status
    return issue
  })
}

export function retireMissingLinkIssues(siteId: string, destinations: string[]) {
  const keys = new Set(destinations.map((destination) => addressKey(destination)))
  return update((db) => {
    const at = new Date().toISOString()
    db.issues = db.issues.map((issue) => {
      if (issue.websiteId !== siteId || issue.category !== 'link' || issue.status === 'resolved') return issue
      if (keys.has(addressKey(issue.pagePath))) return issue
      return {
        ...issue,
        status: 'resolved' as const,
        lastSeenAt: at,
        currentStatus: 'The latest crawl no longer found this link on the page.',
      }
    })
  })
}

export function dueWork(now = Date.now()) {
  const db = read()
  return db.sites.flatMap((site) => {
    if (site.paused) return []
    const checks = db.checks.filter((check) => check.websiteId === site.id)
    const age = (kind: CheckRecord['kind']) => {
      const latest = checks.findLast((check) => check.kind === kind)
      if (!latest) return Number.POSITIVE_INFINITY
      return now - new Date(latest.at).getTime()
    }
    const uptimeEvery = frequencyMs(site.frequency)
    const crawlEvery = Math.max(uptimeEvery, 15 * 60_000)
    const work = {
      id: site.id,
      uptime: Boolean(site.features.uptime) && age('uptime') >= uptimeEvery,
      pages: Boolean(site.features.pages) && age('page') >= uptimeEvery,
      links: Boolean(site.features.brokenLinks) && age('link') >= crawlEvery,
    }
    return work.uptime || work.pages || work.links ? [work] : []
  })
}

export function recordProbe(siteId: string, kind: CheckRecord['kind'], probe: Probe, page?: { id: string; name: string; path: string }, sourceUrl?: string) {
  return update((db) => {
    const site = db.sites.find((item) => item.id === siteId)
    if (!site || site.paused) return null
    const at = new Date().toISOString()
    db.checks = pruneChecks(
      [
        ...db.checks,
        {
          id: randomUUID(),
          websiteId: siteId,
          kind,
          url: probe.finalUrl || site.url,
          at,
          ok: probe.ok,
          httpStatus: probe.httpStatus,
          responseTimeMs: probe.responseTimeMs,
          error: probe.error,
          confirmed: probe.confirmed,
        },
      ],
      siteId,
    )
    if (kind === 'uptime') {
      const next = nextMonitorState(site.consecutiveFailures, probe)
      site.consecutiveFailures = next.failures
      site.monitorState = next.state
      const evidence = evidenceOf(probe, at)
      db.issues = applyProbeIssue(db.issues, {
        fingerprint: `uptime:${site.id}`,
        websiteId: site.id,
        title: 'Website is down',
        pageName: 'Homepage',
        pagePath: '/',
        severity: 'critical',
        category: 'uptime',
        at,
        observed: probe.error || `HTTP ${probe.httpStatus ?? 'none'}`,
        expected: 'The homepage responds successfully.',
        monitoringResult: `Stored uptime check at ${at}. ${evidence}`,
        technical: technicalOf(probe, at),
        investigation: ['Open the website in a browser.', 'Compare the HTTP status with the latest stored check.', 'Wait for the next scheduled check to confirm recovery.'],
        active: next.state === 'down',
      })
      db.issues = applyProbeIssue(db.issues, {
        fingerprint: `slow:${site.id}`,
        websiteId: site.id,
        title: 'Website is responding slowly',
        pageName: 'Homepage',
        pagePath: '/',
        severity: 'warning',
        category: 'uptime',
        at,
        observed: `Response time was ${probe.responseTimeMs ?? 'unknown'} ms.`,
        expected: `A normal check finishes in under ${SLOW_MS} ms.`,
        monitoringResult: `Stored response time ${probe.responseTimeMs ?? 'unknown'} ms at ${at}.`,
        technical: technicalOf(probe, at),
        investigation: ['Check whether the site is under load.', 'Compare this response time with the stored history.'],
        active: probe.ok && (probe.responseTimeMs ?? 0) >= SLOW_MS,
      })
    }
    if (kind === 'page' && page) {
      const target = site.pages.find((item) => item.id === page.id)
      const failed = probe.confirmed && !probe.ok
      if (target) {
        target.lastChecked = at
        target.status = failed ? 'critical' : probe.ok ? ((probe.responseTimeMs ?? 0) >= SLOW_MS ? 'warning' : 'healthy') : 'unknown'
        target.detail = failed
          ? `HTTP ${probe.httpStatus}.`
          : probe.confirmed
            ? `HTTP ${probe.httpStatus} in ${probe.responseTimeMs} ms.`
            : probe.error || 'This page could not be verified.'
      }
      db.issues = applyProbeIssue(db.issues, {
        fingerprint: `page:${site.id}:${page.path}`,
        websiteId: site.id,
        title: `${page.name} is failing`,
        pageName: page.name,
        pagePath: page.path,
        severity: 'critical',
        category: 'page',
        at,
        observed: probe.error || `HTTP ${probe.httpStatus}`,
        expected: `${page.name} responds successfully.`,
        monitoringResult: `Stored page check for ${page.path} at ${at}. ${evidenceOf(probe, at)}`,
        technical: technicalOf(probe, at),
        investigation: ['Open the page address directly.', 'Check whether the path is still published.'],
        active: failed,
      })
    }
    if (kind === 'link') {
      const broken = probe.confirmed && !probe.ok
      db.issues = applyProbeIssue(db.issues, {
        fingerprint: `link:${site.id}:${probe.finalUrl}`,
        websiteId: site.id,
        title: 'Broken link',
        pageName: 'Link',
        pagePath: probe.finalUrl,
        severity: probe.httpStatus !== null && probe.httpStatus >= 500 ? 'critical' : 'warning',
        category: 'link',
        at,
        observed: probe.error || `HTTP ${probe.httpStatus}`,
        expected: 'The link opens.',
        monitoringResult: broken
          ? `Confirmed broken link at ${at}. ${evidenceOf(probe, at)}`
          : `Link check at ${at} did not confirm a broken link.`,
        technical: [
          ...technicalOf(probe, at),
          { label: 'Scope', value: scopeLabel(site.url, probe.finalUrl) },
          ...(sourceUrl ? [{ label: 'Found on', value: sourceUrl }] : []),
        ],
        investigation: ['Open the issue details.', 'Compare the destination with the page that contains the link.', 'Update or remove the link if the destination is gone.'],
        active: broken,
      })
    }
    return true
  })
}

export function replaceLinks(siteId: string, links: LinkRow[]) {
  return update((db) => {
    db.links = [...db.links.filter((link) => link.websiteId !== siteId), ...links].slice(-400)
  })
}

function scopeLabel(registeredUrl: string, target: string) {
  const scope = websiteScope(registeredUrl, target)
  if (scope === 'external') return 'External link'
  if (scope === 'internal') return 'Internal page'
  return 'Unknown'
}

function evidenceOf(probe: Probe, at: string) {
  return `HTTP ${probe.httpStatus ?? 'none'}, ${probe.responseTimeMs ?? 'no'} ms, confirmed ${probe.confirmed ? 'yes' : 'no'}, at ${at}.`
}

function technicalOf(probe: Probe, at: string) {
  return [
    { label: 'HTTP status', value: probe.httpStatus === null ? 'None' : String(probe.httpStatus) },
    { label: 'Response time', value: probe.responseTimeMs === null ? 'Not measured' : `${probe.responseTimeMs} ms` },
    { label: 'Checked at', value: at },
    { label: 'Confirmed response', value: probe.confirmed ? 'Yes' : 'No' },
    { label: 'Final URL', value: probe.finalUrl || 'Unknown' },
  ]
}

function viewAll(db: Database) {
  return {
    websites: db.sites.map((site) => viewSite(db, site)),
    issues: db.issues.map(viewIssue),
  }
}

function viewSite(db: Database, site: SiteRecord) {
  const checks = db.checks.filter((check) => check.websiteId === site.id)
  const uptime = checks.filter((check) => check.kind === 'uptime')
  const latest = uptime.at(-1) ?? null
  const count = uptime.length
  return {
    id: site.id,
    name: site.name,
    url: site.url,
    isDemo: false,
    addedAt: site.addedAt,
    features: site.features,
    pages: site.pages,
    forms: site.forms,
    checkout: site.checkout,
    paused: site.paused,
    frequency: site.frequency,
    monitorState: site.paused ? 'paused' : site.monitorState,
    consecutiveFailures: site.consecutiveFailures,
    checkCount: count,
    uptimePercent: uptimePercent(checks),
    reachability: latest
      ? {
          checkedAt: latest.at,
          ok: latest.ok,
          httpStatus: latest.httpStatus,
          responseTimeMs: latest.responseTimeMs,
          finalUrl: latest.url,
          message: latest.ok
            ? `HTTP ${latest.httpStatus} in ${latest.responseTimeMs} ms.`
            : latest.error || `The check failed at ${latest.at}.`,
        }
      : null,
    series: uptime.slice(-24).map((check) => ({
      label: check.at.slice(11, 16),
      responseMs: check.responseTimeMs,
      up: check.ok,
    })),
    incidents: incidentsFrom(uptime),
    links: db.links.filter((link) => link.websiteId === site.id),
    activity: checks.slice(-8).reverse().map((check) => ({
      id: check.id,
      pageName: check.kind,
      description: check.ok ? `${check.kind} check succeeded` : check.error || `${check.kind} check failed`,
      status: check.ok ? 'healthy' : !check.confirmed ? 'unknown' : check.kind === 'link' ? 'warning' : 'critical',
      timestamp: check.at,
      href: check.kind === 'link' ? '/monitoring/links' : check.kind === 'page' ? '/monitoring/pages' : '/monitoring/uptime',
    })),
  }
}

function incidentsFrom(checks: CheckRecord[]) {
  const incidents: Array<{ id: string; title: string; startedAt: string; recoveredAt: string | null; duration: string; status: 'ongoing' | 'resolved'; summary: string; events: Array<{ time: string; title: string; detail: string; tone: string }> }> = []
  let run: CheckRecord[] = []
  const flush = (recovered: CheckRecord | null) => {
    if (run.length < 2) {
      run = []
      return
    }
    const first = run[0]
    const last = run[run.length - 1]
    if (!first || !last) return
    incidents.push({
      id: `incident-${first.id}`,
      title: 'Repeated check failures',
      startedAt: first.at,
      recoveredAt: recovered?.at ?? null,
      duration: recovered ? `${Math.max(1, Math.round((new Date(recovered.at).getTime() - new Date(first.at).getTime()) / 60000))} min` : 'Ongoing',
      status: recovered ? 'resolved' : 'ongoing',
      summary: `${run.length} stored checks failed in a row.`,
      events: [
        { time: first.at, title: 'Failures started', detail: first.error || 'Check failed', tone: 'critical' },
        { time: last.at, title: recovered ? 'Recovered' : 'Still failing', detail: recovered ? 'A later check succeeded.' : last.error || 'Check failed', tone: recovered ? 'healthy' : 'critical' },
      ],
    })
    run = []
  }
  for (const check of checks) {
    if (!check.ok) run.push(check)
    else flush(check)
  }
  flush(null)
  return incidents.slice(-8).reverse()
}

function viewIssue(issue: TrackedIssue) {
  return {
    ...issue,
    isDemo: false,
    explanation: {
      whatHappened: issue.whatHappened,
      why: [issue.monitoringResult],
      seriousness: issue.severity === 'critical' ? 'This was serious enough to keep open.' : 'This is a warning from a stored check.',
      nextSteps: issue.investigation,
      technical: issue.technical.map((item) => `${item.label}: ${item.value}`),
    },
  }
}
