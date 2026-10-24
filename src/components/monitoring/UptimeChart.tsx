import type { UptimePoint } from '../../types/index.ts'

export function UptimeChart({ data }: { data: UptimePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-56 place-items-center rounded-xl border border-dashed border-line text-center text-sm text-muted">
        No response history is stored yet.
      </div>
    )
  }
  const width = 640
  const height = 220
  const pad = { top: 16, right: 12, bottom: 28, left: 36 }
  const values = data.map((point) => point.responseMs ?? 0)
  const max = Math.max(400, ...values)
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom
  const step = data.length === 1 ? innerWidth : innerWidth / (data.length - 1)
  const points = data.map((point, index) => {
    const value = point.responseMs
    const x = pad.left + index * step
    const y = value === null ? null : pad.top + innerHeight - (value / max) * innerHeight
    return { x, y, label: point.label, value }
  })
  const line = points.flatMap((point) => (point.y === null ? [] : [`${point.x},${point.y}`])).join(' ')
  const area = `${pad.left},${pad.top + innerHeight} ${line} ${pad.left + (data.length - 1) * step},${pad.top + innerHeight}`
  const ticks = [0, Math.round(max / 2), max]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Response time from stored checks">
      {ticks.map((tick) => {
        const y = pad.top + innerHeight - (tick / max) * innerHeight
        return (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#223247" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#98A9BD" fontSize="11">
              {tick}
            </text>
          </g>
        )
      })}
      <polygon points={area} fill="#64D8F5" opacity="0.18" />
      <polyline points={line} fill="none" stroke="#64D8F5" strokeWidth="2" />
      {points.filter((point) => point.y !== null).map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y ?? 0} r="2.5" fill="#64D8F5">
          <title>{`${point.label}: ${point.value} ms`}</title>
        </circle>
      ))}
      {points.filter((_, index) => index % 4 === 0).map((point) => (
        <text key={`${point.label}-axis`} x={point.x} y={height - 8} textAnchor="middle" fill="#98A9BD" fontSize="11">
          {point.label}
        </text>
      ))}
    </svg>
  )
}
