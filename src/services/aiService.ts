import type { ChatMessage, Explanation, ExplainRequest } from '../types/index.ts'
import { readJson } from './http.ts'

export async function checkWebsiteUrl(url: string, signal?: AbortSignal) {
  const response = await fetch('/api/check-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
    signal,
  })
  const data = await readJson<{
    error?: string
    code?: string
    result?: {
      ok: boolean
      httpStatus: number | null
      responseTimeMs: number | null
      finalUrl: string
      message: string
      checkedAt: string
    }
  }>(response).catch((error: unknown) => {
    if (error instanceof Error) throw error
    throw new Error('The monitoring server is not reachable from this site.')
  })
  if (!response.ok || !data?.result) {
    const error = new Error(data?.error || 'The setup check could not be completed.')
    return Promise.reject(Object.assign(error, { code: data?.code ?? 'UNREACHABLE' }))
  }
  return { ...data.result, code: data.code }
}

export async function requestExplanation(input: ExplainRequest, beginner: boolean): Promise<Explanation> {
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      monitoringResult: input.monitoringResult,
      expected: input.expected,
      observed: input.observed,
      technical: input.technical,
      beginner,
    }),
  })
  const data = await readJson<{ error?: string; explanation?: Explanation }>(response).catch(() => null)
  if (!response.ok || !data?.explanation) {
    throw new Error(data?.error || 'The AI explanation could not be completed.')
  }
  return data.explanation
}

export async function requestChat(messages: ChatMessage[], context: string, beginner: boolean) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: messages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({ role: message.role, content: message.content })),
      context,
      beginner,
    }),
  })
  const data = await readJson<{ error?: string; reply?: string }>(response).catch(() => null)
  if (!response.ok || !data?.reply) {
    throw new Error(data?.error || 'The assistant could not reply.')
  }
  return data.reply
}
