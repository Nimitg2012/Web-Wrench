import type { Frequency, HealthStatus } from '../types/index.ts'

export const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  unknown: 'Unknown',
}

export const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: '#4DE0B0',
  warning: '#F4BD68',
  critical: '#FF727C',
  unknown: '#98A9BD',
}

export const FREQUENCY_OPTIONS: Frequency[] = ['1m', '5m', '15m', '1h', '6h', '24h']

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  '1m': 'Every minute',
  '5m': 'Every 5 minutes',
  '15m': 'Every 15 minutes',
  '1h': 'Every hour',
  '6h': 'Every 6 hours',
  '24h': 'Once a day',
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function formatRelative(iso: string | null) {
  if (!iso) return 'Not checked'
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return 'Unknown time'
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
