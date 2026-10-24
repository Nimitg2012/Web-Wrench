export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}
