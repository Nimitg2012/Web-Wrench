import { parseTriggerDelivery } from '@neon/functions/triggers'
import { corsHeaders, dispatchApi } from './api.ts'
import { runDue } from './jobs.ts'

function serverEnv() {
  const env: Record<string, string> = {}
  for (const key of ['GROQ_API_KEY', 'AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL']) {
    const value = process.env[key]?.trim()
    if (value) env[key] = value
  }
  return env
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)
    if (url.pathname === '/cron') {
      const parsed = await parseTriggerDelivery(request)
      if (!parsed.ok) {
        const status = parsed.error === 'invalid_body' ? 400 : 401
        return new Response(parsed.error, { status })
      }
      await runDue()
      return Response.json({ ok: true })
    }

    const headers = corsHeaders(request.headers.get('origin'))
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })

    let body: unknown = {}
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const text = await request.text()
      if (text.length > 32_000) {
        return Response.json({ error: 'That request is too large.', code: 'INVALID' }, { status: 413, headers })
      }
      if (text) {
        try {
          body = JSON.parse(text) as unknown
        } catch {
          return Response.json({ error: 'Send valid JSON.', code: 'INVALID' }, { status: 400, headers })
        }
      }
    }

    const result = await dispatchApi({
      method: request.method,
      pathname: url.pathname,
      body,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      signal: AbortSignal.timeout(30_000),
      env: serverEnv(),
    })
    return Response.json(result.body, { status: result.status, headers })
  },
}
