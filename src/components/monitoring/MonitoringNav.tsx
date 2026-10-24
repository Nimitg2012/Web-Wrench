import { NavLink } from 'react-router-dom'
import { cx } from '../../utils/cx.ts'

const LINKS = [
  { to: '/monitoring/uptime', label: 'Uptime' },
  { to: '/monitoring/links', label: 'Broken links' },
  { to: '/monitoring/pages', label: 'Important pages' },
  { to: '/monitoring/forms', label: 'Forms' },
  { to: '/monitoring/checkout', label: 'Checkout' },
]

export function MonitoringNav() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cx(
              'inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm md:min-h-0 md:px-3 md:py-1.5',
              isActive ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-line text-muted hover:text-ink',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  )
}
