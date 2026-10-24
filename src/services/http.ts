export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw Object.assign(new Error('The monitoring server is not reachable from this site.'), { code: 'UNREACHABLE' })
  }
}
