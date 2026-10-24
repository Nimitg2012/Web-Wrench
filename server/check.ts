import http from 'node:http'
import https from 'node:https'
import { lookup } from 'node:dns'
import { assertPublicUrl, guardError, isPrivateIp, publicUrl } from './guard.ts'

export interface CheckResult {
  ok: boolean
  httpStatus: number | null
  responseTimeMs: number | null
  finalUrl: string
  message: string
  checkedAt: string
}

export async function checkPublicUrl(raw: string, signal: AbortSignal, mode: 'setup' | 'monitor' = 'setup'): Promise<CheckResult> {
  const response = await followPublic(raw, signal, false)
  const ok = response.status >= 200 && response.status < 400
  return {
    ok,
    httpStatus: response.status,
    responseTimeMs: response.responseTimeMs,
    finalUrl: publicUrl(response.finalUrl),
    checkedAt: new Date().toISOString(),
    message: ok
      ? mode === 'monitor'
        ? `HTTP ${response.status} in ${response.responseTimeMs} ms.`
        : `A one-time setup check received HTTP ${response.status}. Continuous monitoring has not started.`
      : mode === 'monitor'
        ? `The check received HTTP ${response.status}.`
        : `The website responded with HTTP ${response.status} during a one-time setup check. Continuous monitoring has not started.`,
  }
}

export async function fetchPublicDocument(raw: string, signal: AbortSignal) {
  const response = await followPublic(raw, signal, true)
  return {
    httpStatus: response.status,
    responseTimeMs: response.responseTimeMs,
    finalUrl: publicUrl(response.finalUrl),
    html: response.body,
    contentType: response.contentType,
  }
}

async function followPublic(raw: string, signal: AbortSignal, readBody: boolean) {
  const started = Date.now()
  let current = await assertPublicUrl(raw)
  for (let hop = 0; hop <= 3; hop += 1) {
    if (signal.aborted) throw guardError('The check was cancelled.', 'TIMEOUT')
    const remaining = 12_000 - (Date.now() - started)
    if (remaining <= 250) throw guardError('The website took too long to respond.', 'TIMEOUT')
    const response = await requestPinned(current, Math.min(remaining, 8_000), signal, readBody)
    if (response.status >= 300 && response.status < 400) {
      const location = headerValue(response.headers.location)
      if (!location || hop === 3) throw guardError('The website redirected too many times.', 'UNREACHABLE')
      current = await assertPublicUrl(new URL(location, current).toString())
      continue
    }
    return { ...response, finalUrl: current }
  }
  throw guardError('The website redirected too many times.', 'UNREACHABLE')
}

function requestPinned(url: URL, timeoutMs: number, signal: AbortSignal, readBody: boolean) {
  const started = Date.now()
  const address = awaitPublicAddress(url.hostname)
  return address.then((ip) => new Promise<PinnedResponse>((resolve, reject) => {
    if (signal.aborted) {
      reject(guardError('The check was cancelled.', 'TIMEOUT'))
      return
    }
    const transport = url.protocol === 'https:' ? https : http
    const request = transport.request(
      {
        hostname: ip.address,
        servername: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}` || '/',
        method: 'GET',
        family: ip.family === 6 ? 6 : 4,
        headers: {
          host: url.host,
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'user-agent': 'WebWrenchMonitor/1.0',
        },
        timeout: timeoutMs,
        signal,
      },
      (response) => {
        const contentType = headerValue(response.headers['content-type']) ?? ''
        const wantsBody = readBody && /html|xml|text/i.test(contentType)
        if (!wantsBody) {
          response.resume()
          response.on('error', () => undefined)
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            responseTimeMs: Date.now() - started,
            body: '',
            contentType,
          })
          return
        }
        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size <= 180_000) chunks.push(chunk)
          if (size > 180_000) response.destroy()
        })
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            responseTimeMs: Date.now() - started,
            body: Buffer.concat(chunks).toString('utf8'),
            contentType,
          })
        })
        response.on('error', () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            responseTimeMs: Date.now() - started,
            body: Buffer.concat(chunks).toString('utf8'),
            contentType,
          })
        })
      },
    )
    request.on('timeout', () => {
      request.destroy()
      reject(guardError('The website took too long to respond.', 'TIMEOUT'))
    })
    request.on('error', (error: NodeJS.ErrnoException) => {
      if (signal.aborted) reject(guardError('The check was cancelled.', 'TIMEOUT'))
      else if (error.code === 'ENOTFOUND') reject(guardError('That hostname could not be found.', 'UNREACHABLE'))
      else if (error.code?.includes('CERT') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') reject(guardError('The TLS certificate could not be verified.', 'UNREACHABLE'))
      else reject(guardError('Web Wrench could not open a connection to that website.', 'UNREACHABLE'))
    })
    request.end()
  }))
}

interface PinnedResponse {
  status: number
  headers: http.IncomingHttpHeaders
  responseTimeMs: number
  body: string
  contentType: string
}

function awaitPublicAddress(hostname: string) {
  return new Promise<{ address: string; family: number }>((resolve, reject) => {
    lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
      if (error || addresses.length === 0) {
        reject(guardError('That hostname could not be found.', 'UNREACHABLE'))
        return
      }
      if (addresses.some((item) => isPrivateIp(item.address))) {
        reject(guardError('Private, local, and metadata addresses cannot be checked.', 'BLOCKED'))
        return
      }
      const chosen = addresses[0]
      if (!chosen) {
        reject(guardError('That hostname could not be found.', 'UNREACHABLE'))
        return
      }
      resolve({ address: chosen.address, family: chosen.family })
    })
  })
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
