import { checkPublicUrl, fetchPublicDocument } from './check.ts'
import { dueWork, readSnapshot, recordProbe, replaceLinks, retireMissingLinkIssues, type LinkRow } from './db.ts'
import { extractLinks, issueIdFor, type Probe } from './engine.ts'
import { websiteScope } from '../src/utils/url.ts'
import { isGuardError } from './guard.ts'

const running = new Set<string>()
let timer: ReturnType<typeof setInterval> | null = null

export function startScheduler() {
  if (timer) return
  timer = setInterval(() => {
    void runDue()
  }, 20_000)
  timer.unref?.()
  setTimeout(() => void runDue(), 2_000)
}

export async function runDue() {
  const jobs = dueWork().filter((job) => !running.has(job.id)).slice(0, 2)
  await Promise.all(jobs.map((job) => runSite(job.id, job)))
}

export async function runSite(siteId: string, work?: { uptime: boolean; pages: boolean; links: boolean }) {
  if (running.has(siteId)) return
  const snapshot = readSnapshot().websites.find((site) => site.id === siteId)
  if (!snapshot || snapshot.paused) return
  const plan = work ?? {
    uptime: snapshot.features.uptime,
    pages: snapshot.features.pages,
    links: snapshot.features.brokenLinks,
  }
  if (!plan.uptime && !plan.pages && !plan.links) return
  running.add(siteId)
  const signal = AbortSignal.timeout(90_000)
  try {
    if (plan.uptime) {
      const home = await probe(snapshot.url, signal)
      await recordProbe(siteId, 'uptime', home)
    }
    if (plan.pages) {
      for (const page of snapshot.pages.slice(0, 8)) {
        const target = new URL(page.path, snapshot.url).toString()
        const result = await probe(target, signal)
        await recordProbe(siteId, 'page', result, page)
      }
    }
    if (plan.links) {
      await crawlLinks(siteId, snapshot.url, signal)
    }
  } finally {
    running.delete(siteId)
  }
}

async function crawlLinks(siteId: string, url: string, signal: AbortSignal) {
  let html = ''
  let source = url
  try {
    const document = await fetchPublicDocument(url, signal)
    html = document.html
    source = document.finalUrl
  } catch {
    await replaceLinks(siteId, [])
    return
  }
  const destinations = extractLinks(html, source).filter((link) => link !== source)
  const rows: LinkRow[] = []
  for (const destination of destinations) {
    if (signal.aborted) break
    const result = await probe(destination, signal)
    const status = linkStatus(destination, result)
    const scope = websiteScope(url, destination)
    const issueId = status === 'broken' ? issueIdFor(`link:${siteId}:${destination}`) : undefined
    const scopeNote = scope === 'external' ? 'External link. ' : scope === 'internal' ? 'Internal page. ' : ''
    rows.push({
      id: `link-${rows.length}-${siteId}`,
      websiteId: siteId,
      source,
      destination,
      status,
      httpStatus: result.httpStatus,
      lastChecked: new Date().toISOString(),
      description:
        status === 'broken'
          ? `${scopeNote}${result.error || `Confirmed HTTP ${result.httpStatus}.`}`
          : status === 'unverified'
            ? result.error || 'The link could not be verified. It is not listed as broken.'
            : status === 'redirect'
              ? `${scopeNote}The link redirected to ${result.finalUrl}.`
              : `${scopeNote}HTTP ${result.httpStatus}.`,
      issueId,
    })
    await recordProbe(siteId, 'link', { ...result, finalUrl: destination }, undefined, source)
  }
  await replaceLinks(siteId, rows)
  await retireMissingLinkIssues(siteId, destinations)
}

function linkStatus(requested: string, result: Probe): LinkRow['status'] {
  if (!result.confirmed) return 'unverified'
  if (!result.ok) return 'broken'
  if (stripSlash(result.finalUrl) !== stripSlash(requested)) return 'redirect'
  return 'ok'
}

function stripSlash(value: string) {
  return value.replace(/\/$/, '')
}

async function probe(url: string, signal: AbortSignal): Promise<Probe> {
  try {
    const result = await checkPublicUrl(url, signal, 'monitor')
    return {
      ok: result.ok,
      httpStatus: result.httpStatus,
      responseTimeMs: result.responseTimeMs,
      error: result.ok ? null : result.message,
      confirmed: result.httpStatus !== null,
      finalUrl: result.finalUrl,
    }
  } catch (error) {
    const message = isGuardError(error) ? error.message : 'The check failed.'
    const blocked = isGuardError(error) && error.code === 'BLOCKED'
    return {
      ok: false,
      httpStatus: null,
      responseTimeMs: null,
      error: blocked ? 'The address was blocked by safety checks and was not opened.' : message,
      confirmed: false,
      finalUrl: url,
    }
  }
}
