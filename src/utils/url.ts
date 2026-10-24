const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data',
])

const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost', '.localdomain', '.home.arpa', '.lan']

export function normalizeWebsiteUrl(raw: string) {
  const value = raw.trim()
  if (!value) return ''
  if (value.startsWith('//')) return `https:${value}`
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value
  return `https://${value}`
}

export type LinkScope = 'internal' | 'external' | 'unknown'

export function websiteScope(registeredUrl: string, target: string): LinkScope {
  const registered = httpUrl(registeredUrl)
  if (!registered) return 'unknown'
  const value = target.trim()
  if (!value) return 'unknown'
  if (value.startsWith('/') && !value.startsWith('//')) return 'internal'
  let url: URL
  try {
    url = new URL(value, registered)
  } catch {
    return 'unknown'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'unknown'
  return siteHost(url) === siteHost(registered) ? 'internal' : 'external'
}

export function absolutePageUrl(registeredUrl: string, target: string) {
  const registered = httpUrl(registeredUrl)
  if (!registered) return null
  const value = target.trim()
  if (!value) return null
  try {
    const url = new URL(value, registered)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function httpUrl(raw: string) {
  try {
    const url = new URL(normalizeWebsiteUrl(raw))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

function siteHost(url: URL) {
  return url.hostname.replace(/^www\./i, '').replace(/\.$/, '').toLowerCase()
}

export function canonicalWebsiteUrl(raw: string) {
  const normalized = normalizeWebsiteUrl(raw)
  if (!normalized || validatePublicUrlShape(normalized)) return null
  const url = new URL(normalized)
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  const path = url.pathname.replace(/\/+$/, '')
  return `${url.protocol}//${host}${path}`
}

export function validatePublicUrlShape(raw: string): string | null {
  const value = raw.trim()
  if (!value) return 'Enter a website URL.'
  if (value.length > 2000) return 'That URL is too long.'
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'Enter a full URL, including https://.'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Only http and https websites can be added.'
  }
  if (url.username || url.password) return 'Remove the username and password from the URL.'
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host) return 'That URL is missing a website address.'
  if (BLOCKED_HOSTS.has(host) || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return 'Local and internal addresses cannot be monitored.'
  }
  if (/^\d+$/.test(host) || host.startsWith('0x')) {
    return 'Enter the website address as a normal domain name.'
  }
  if (/^(?:\d{1,3}\.){1,3}\d{1,3}$/.test(host)) {
    if (!isStrictIpv4(host) || isPrivateIpv4(host)) {
      return 'That network address cannot be monitored.'
    }
  }
  if (host.includes(':') && isPrivateIp(host)) return 'That network address cannot be monitored.'
  return null
}

export function validatePagePath(path: string): string | null {
  const value = path.trim()
  if (!value.startsWith('/')) return 'Enter a path that starts with /, such as /contact.'
  if (value.length > 200) return 'That path is too long.'
  if (value.includes('..') || value.includes('\\') || value.includes('//')) {
    return 'Use a simple path without .. or repeated slashes.'
  }
  if (!/^\/[A-Za-z0-9\-._~/%]*$/.test(value)) {
    return 'Use only letters, numbers, and simple path symbols.'
  }
  return null
}

export function isPrivateIpv4(ip: string) {
  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b, c] = parts
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

function isStrictIpv4(ip: string) {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => /^\d{1,3}$/.test(part) && !(part.length > 1 && part.startsWith('0')) && Number(part) <= 255)
}

function isPrivateIp(ip: string) {
  const value = ip.toLowerCase().split('%')[0] ?? ip
  if (!value.includes(':')) return isPrivateIpv4(value)
  if (value === '::1' || value === '::' || value === '::0') return true
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value)
  if (mapped?.[1]) return isPrivateIpv4(mapped[1])
  const first = Number.parseInt(value.split(':')[0] || '0', 16)
  if (Number.isNaN(first)) return true
  if (first >= 0xfc00 && first <= 0xfdff) return true
  if (first >= 0xfe80 && first <= 0xfebf) return true
  if (first >= 0xff00) return true
  return false
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
