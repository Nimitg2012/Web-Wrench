import type { IncomingMessage, ServerResponse } from 'node:http'
import { chatWithModel, explainWithModel } from './ai.ts'
import { checkPublicUrl } from './check.ts'
import { createSite, deleteSite, patchSite, readSnapshot, setIssueStatus } from './db.ts'
import { assertPublicUrl, isGuardError } from './guard.ts'
import { runSite } from './jobs.ts'

const hits = new Map<string, number[]>()

export function createApiMiddleware(env: Record<string, string>) {
  return (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
    const url = new URL(req.url ?? '/', 'http://webwrench.local')
    if (!url.pathname.startsWith('/api/')) {
      next()
      return
    }
    void handle(req, res, url.pathname, env)
  }
}

async function handle(req: IncomingMessage, res: ServerResponse, pathname: string, env: Record<string, string>) {
  try {
    if (req.method === 'GET' && pathname === '/api/monitor') {
      if (!allow(clientIp(req), pathname, 120)) {
        send(res, 429, { error: 'Too many requests. Wait a minute and try again.', code: 'UNREACHABLE' })
        return
      }
      send(res, 200, readSnapshot())
      return
    }
    if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'DELETE') {
      send(res, 405, { error: 'That method is not supported.', code: 'INVALID' })
      return
    }
    const limit = pathname === '/api/check-url' ? 20 : 30
    if (!allow(clientIp(req), pathname, limit)) {
      send(res, 429, { error: 'Too many requests. Wait a minute and try again.', code: 'UNREACHABLE' })
      return
    }
    const body = await readJson(req)
    const signal = abortOnClose(req, res)
    if (pathname === '/api/websites' && req.method === 'POST') {
      const url = stringField(body, 'url')
      await assertPublicUrl(url)
      const features = objectField(body, 'features')
      const saved = await createSite({
        id: stringField(body, 'id'),
        name: stringField(body, 'name'),
        url,
        frequency: stringField(body, 'frequency'),
        features: featureFlags(features),
        pages: arrayField(body, 'pages'),
        forms: arrayField(body, 'forms'),
        checkout: objectField(body, 'checkout') as never,
      })
      if (saved.created) void runSite(saved.site.id)
      send(res, saved.created ? 201 : 200, { website: saved.site, created: saved.created })
      return
    }
    const websiteMatch = pathname.match(/^\/api\/websites\/([^/]+)(?:\/(pause|resume))?$/)
    if (websiteMatch) {
      const id = decodeURIComponent(websiteMatch[1] ?? '')
      const action = websiteMatch[2]
      if (action === 'pause' || action === 'resume') {
        const site = await patchSite(id, { paused: action === 'pause' })
        if (!site) { send(res, 404, { error: 'That website is not saved.', code: 'INVALID' }); return }
        if (action === 'resume') void runSite(id)
        send(res, 200, { website: site })
        return
      }
      if (req.method === 'DELETE') {
        const removed = await deleteSite(id)
        send(res, removed ? 200 : 404, removed ? { ok: true } : { error: 'That website is not saved.', code: 'INVALID' })
        return
      }
      if (req.method === 'PATCH') {
        const site = await patchSite(id, {
          name: stringField(body, 'name') || undefined,
          frequency: (stringField(body, 'frequency') || undefined) as never,
          features: featureFlags(objectField(body, 'features')),
          pages: arrayField(body, 'pages'),
          forms: arrayField(body, 'forms'),
          checkout: objectField(body, 'checkout') as never,
        })
        if (!site) { send(res, 404, { error: 'That website is not saved.', code: 'INVALID' }); return }
        send(res, 200, { website: site })
        return
      }
    }
    const issueMatch = pathname.match(/^\/api\/issues\/([^/]+)\/status$/)
    if (issueMatch && req.method === 'POST') {
      const status = stringField(body, 'status')
      if (status !== 'active' && status !== 'reviewed' && status !== 'resolved') {
        send(res, 400, { error: 'Choose active, reviewed, or resolved.', code: 'INVALID' })
        return
      }
      const issue = await setIssueStatus(decodeURIComponent(issueMatch[1] ?? ''), status)
      if (!issue) { send(res, 404, { error: 'That issue is not saved.', code: 'INVALID' }); return }
      send(res, 200, { issue })
      return
    }
    if (pathname === '/api/check-url') {
      const url = stringField(body, 'url')
      const result = await checkPublicUrl(url, signal)
      send(res, 200, { result })
      return
    }
    if (pathname === '/api/ai/explain') {
      const explanation = await explainWithModel(env, {
        title: stringField(body, 'title'),
        monitoringResult: stringField(body, 'monitoringResult'),
        expected: stringField(body, 'expected'),
        observed: stringField(body, 'observed'),
        technical: stringField(body, 'technical'),
        beginner: booleanField(body, 'beginner'),
      }, signal)
      send(res, 200, { explanation })
      return
    }
    if (pathname === '/api/ai/chat') {
      const messages = chatField(body)
      const reply = await chatWithModel(env, {
        messages,
        context: stringField(body, 'context'),
        beginner: booleanField(body, 'beginner'),
      }, signal)
      send(res, 200, { reply })
      return
    }
    send(res, 404, { error: 'That API endpoint does not exist.', code: 'INVALID' })
  } catch (error) {
    if (isGuardError(error)) {
      const aiMissing = error.message.includes('GROQ_API_KEY') || error.message.includes('AI_API_KEY')
      const status = aiMissing ? 503 : error.code === 'INVALID' || error.code === 'BLOCKED' ? 400 : 503
      send(res, status, { error: error.message, code: aiMissing ? 'AI_UNAVAILABLE' : error.code })
      return
    }
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
      send(res, 413, { error: 'That request is too large.', code: 'INVALID' })
      return
    }
    if (error instanceof SyntaxError) {
      send(res, 400, { error: 'Send valid JSON.', code: 'INVALID' })
      return
    }
    send(res, 500, { error: 'The request could not be completed.', code: 'UNREACHABLE' })
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function clientIp(req: IncomingMessage) {
  return (req.socket.remoteAddress ?? 'unknown').replace('::ffff:', '')
}

function allow(ip: string, route: string, limit: number) {
  const key = `${ip}:${route}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 5 * 60_000)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 32_000) throw new Error('BODY_TOO_LARGE')
    chunks.push(buffer)
  }
  if (size === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

function objectField(body: unknown, key: string) {
  if (!body || typeof body !== 'object' || !(key in body)) return undefined
  const value = (body as Record<string, unknown>)[key]
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function arrayField<T>(body: unknown, key: string) {
  if (!body || typeof body !== 'object' || !(key in body)) return undefined
  const value = (body as Record<string, unknown>)[key]
  return Array.isArray(value) ? (value as T[]) : undefined
}

function featureFlags(value: Record<string, unknown> | undefined) {
  if (!value) return undefined
  const next: Partial<{ uptime: boolean; brokenLinks: boolean; pages: boolean; forms: boolean; checkout: boolean }> = {}
  for (const key of ['uptime', 'brokenLinks', 'pages', 'forms', 'checkout'] as const) {
    if (typeof value[key] === 'boolean') next[key] = value[key]
  }
  return next
}

function stringField(body: unknown, key: string) {
  if (!body || typeof body !== 'object' || !(key in body)) return ''
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.slice(0, 4000) : ''
}

function booleanField(body: unknown, key: string) {
  if (!body || typeof body !== 'object' || !(key in body)) return true
  return (body as Record<string, unknown>)[key] !== false
}

function chatField(body: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!body || typeof body !== 'object' || !('messages' in body)) return []
  const value = (body as Record<string, unknown>).messages
  if (!Array.isArray(value)) return []
  return value.slice(-12).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const role = (item as Record<string, unknown>).role
    const content = (item as Record<string, unknown>).content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) return []
    return [{ role, content: content.slice(0, 4000) }]
  })
}

function abortOnClose(req: IncomingMessage, res: ServerResponse) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  const cancelIfAbandoned = () => {
    clearTimeout(timer)
    if (!res.writableEnded) controller.abort()
  }
  req.on('aborted', cancelIfAbandoned)
  res.on('close', cancelIfAbandoned)
  return controller.signal
}
