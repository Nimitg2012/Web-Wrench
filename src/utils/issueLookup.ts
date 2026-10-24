function decoded(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function findIssueByRoute<T extends { id: string; fingerprint?: string }>(issues: T[], routeId: string) {
  if (!routeId) return null
  const route = decoded(routeId)
  return (
    issues.find((issue) => {
      const keys = [issue.id, issue.fingerprint].filter((value): value is string => Boolean(value))
      return keys.some((key) => key === routeId || decoded(key) === route)
    }) ?? null
  )
}
