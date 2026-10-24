import type { Issue, IssueStatus, Website } from '../types/index.ts'
import { apiUrl } from './apiBase.ts'
import { readJson } from './http.ts'

export async function fetchMonitor(): Promise<{ websites: Website[]; issues: Issue[] }> {
  const response = await fetch(apiUrl('/api/monitor'))
  if (!response.ok) throw new Error('Monitoring data could not be loaded.')
  return readJson<{ websites: Website[]; issues: Issue[] }>(response)
}

export async function createMonitoredWebsite(website: Website) {
  const response = await fetch(apiUrl('/api/websites'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(website),
  })
  const body = await readJson<{ error?: string; created?: boolean }>(response)
  if (!response.ok) throw new Error(body.error || 'The website could not be saved.')
  return body
}

export async function patchMonitoredWebsite(id: string, patch: Partial<Website>) {
  const response = await fetch(apiUrl(`/api/websites/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!response.ok) {
    const body = await readJson<{ error?: string }>(response).catch(() => ({ error: undefined }))
    throw new Error(body.error || 'The website could not be updated.')
  }
}

export async function deleteMonitoredWebsite(id: string) {
  const response = await fetch(apiUrl(`/api/websites/${encodeURIComponent(id)}`), { method: 'DELETE' })
  if (!response.ok) throw new Error('The website could not be removed.')
}

export async function setMonitoringPaused(id: string, paused: boolean) {
  const action = paused ? 'pause' : 'resume'
  const response = await fetch(apiUrl(`/api/websites/${encodeURIComponent(id)}/${action}`), { method: 'POST' })
  if (!response.ok) throw new Error(paused ? 'Monitoring could not be paused.' : 'Monitoring could not be resumed.')
}

export async function setStoredIssueStatus(id: string, status: IssueStatus) {
  const response = await fetch(apiUrl(`/api/issues/${encodeURIComponent(id)}/status`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('The issue status could not be saved.')
}
