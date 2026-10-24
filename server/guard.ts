import { lookup } from 'node:dns'
import { isIP } from 'node:net'

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data',
])

const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost', '.localdomain', '.home.arpa', '.lan']

export type GuardCode = 'INVALID' | 'BLOCKED' | 'UNREACHABLE' | 'TIMEOUT'

export interface GuardError extends Error {
  code: GuardCode
}

export function guardError(message: string, code: GuardCode): GuardError {
  const error = new Error(message)
  error.name = 'RequestGuardError'
  return Object.assign(error, { code })
}

export function isGuardError(error: unknown): error is GuardError {
  return error instanceof Error && error.name === 'RequestGuardError' && 'code' in error
}

export function isPrivateIp(ip: string) {
  const value = ip.toLowerCase().split('%')[0] ?? ip
  if (value.includes(':')) {
    if (value === '::1' || value === '::' || value === '::0') return true
    const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value)
    if (mapped?.[1]) return isPrivateIpv4(mapped[1])
    if (value.startsWith('2001:db8:') || value.startsWith('2001:db8')) return true
    const first = Number.parseInt(value.split(':')[0] || '0', 16)
    if (Number.isNaN(first)) return true
    if (first >= 0xfc00 && first <= 0xfdff) return true
    if (first >= 0xfe80 && first <= 0xfebf) return true
    if (first >= 0xff00) return true
    return false
  }
  return isPrivateIpv4(value)
}

export async function assertPublicUrl(raw: string, httpsOnly = false) {
  const value = raw.trim()
  if (!value || value.length > 2000) {
    throw guardError('Enter a full website URL.', 'INVALID')
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw guardError('Enter a full URL, including https://.', 'INVALID')
  }
  if (httpsOnly && url.protocol !== 'https:') {
    throw guardError('The AI service URL must use https.', 'BLOCKED')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw guardError('Only http and https websites can be checked.', 'INVALID')
  }
  if (url.username || url.password) {
    throw guardError('URLs with a username or password are not allowed.', 'INVALID')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host || BLOCKED_HOSTS.has(host) || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw guardError('Local and internal addresses cannot be checked.', 'BLOCKED')
  }
  if (/^\d+$/.test(host) || /^0x/i.test(host)) {
    throw guardError('That address format cannot be checked.', 'BLOCKED')
  }
  if (/^(?:\d{1,3}\.){1,3}\d{1,3}$/.test(host) && !isStrictPublicIpv4(host)) {
    throw guardError('That network address cannot be checked.', 'BLOCKED')
  }
  const addresses = await resolveHost(host)
  if (addresses.length === 0) {
    throw guardError('That hostname could not be found.', 'UNREACHABLE')
  }
  if (addresses.some((address) => isPrivateIp(address))) {
    throw guardError('Private, local, and metadata addresses cannot be checked.', 'BLOCKED')
  }
  return url
}

export function publicUrl(url: URL) {
  return `${url.origin}${url.pathname}`
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split('.')
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return true
  if (parts.some((part) => part.length > 1 && part.startsWith('0'))) return true
  const [a, b, c] = parts.map((part) => Number(part))
  if (a === undefined || b === undefined || c === undefined) return true
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 192 && b === 0 && c === 0) return true
  if (a === 192 && b === 0 && c === 2) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a === 198 && b === 51 && c === 100) return true
  if (a === 203 && b === 0 && c === 113) return true
  if (a === 100 && b === 100 && c === 100) return true
  if (a >= 224) return true
  return false
}

function isStrictPublicIpv4(ip: string) {
  return !isPrivateIpv4(ip)
}

function resolveHost(host: string) {
  if (isIP(host)) return Promise.resolve([host])
  return new Promise<string[]>((resolve, reject) => {
    lookup(host, { all: true, verbatim: true }, (error, addresses) => {
      if (error) {
        reject(guardError('That hostname could not be found.', 'UNREACHABLE'))
        return
      }
      resolve(addresses.map((address) => address.address))
    })
  })
}
