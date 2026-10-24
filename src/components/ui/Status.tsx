import type { ReactNode } from 'react'
import type { HealthStatus } from '../../types/index.ts'
import { cx } from '../../utils/cx.ts'
import { STATUS_COLOR, STATUS_LABEL } from '../../utils/format.ts'

export function StatusBadge({ status, pulse = false }: { status: HealthStatus; pulse?: boolean }) {
  const color = STATUS_COLOR[status]
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-midnight px-2.5 py-1 text-xs font-medium text-ink">
      <span
        className={cx('h-2 w-2 rounded-full', pulse && status === 'healthy' && 'status-pulse')}
        style={{ background: color, boxShadow: pulse && status !== 'healthy' ? `0 0 0 3px ${color}22` : undefined }}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function DemoTag() {
  return (
    <span className="inline-flex items-center rounded-full border border-purple/40 bg-purple/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-purple">
      Demo data
    </span>
  )
}

export function Banner({ tone = 'info', children }: { tone?: 'demo' | 'info' | 'warning'; children: ReactNode }) {
  const styles = {
    demo: 'border-purple/30 bg-purple/10 text-ink',
    info: 'border-line bg-panel-2 text-muted',
    warning: 'border-warn/30 bg-warn/10 text-ink',
  }[tone]
  return <div className={cx('rounded-xl border px-4 py-3 text-sm leading-6', styles)}>{children}</div>
}

export function DemoBanner() {
  return (
    <Banner tone="demo">
      <span className="mr-2 font-semibold text-purple">DEMO MODE</span>
      These are simulated monitoring results. No real website is being monitored.
    </Banner>
  )
}

export function ComingSoon() {
  return (
    <span className="rounded-full border border-line bg-midnight px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
      Coming soon
    </span>
  )
}
