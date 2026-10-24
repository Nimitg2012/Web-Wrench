export function apiUrl(path: string) {
  const origin = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '')
  return `${origin}${path}`
}
