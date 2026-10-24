import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
        className="cursor-help underline decoration-dotted decoration-muted/70 underline-offset-4"
      >
        {children}
      </span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-line bg-sidebar px-3 py-2 text-left text-xs leading-5 font-normal break-words text-ink no-underline shadow-card"
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}

export function Term({ tip, children }: { tip: string; children: ReactNode }) {
  return <Tooltip content={tip}>{children}</Tooltip>
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-midnight/80 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-panel p-5 shadow-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button ref={closeRef} type="button" className="min-h-11 shrink-0 px-2 text-sm text-muted md:min-h-0 md:px-0" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode
  title: string
  body: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel/70 px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-line bg-panel-2 text-cyan">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {children ? <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1.5 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  )
}

export const controlClass =
  'w-full rounded-xl border border-line bg-midnight px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-muted/60 focus:border-cyan md:text-sm'

export function Toggle({
  checked,
  label,
  description,
  badge,
  onChange,
}: {
  checked: boolean
  label: string
  description?: string
  badge?: ReactNode
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-midnight px-4 py-3 text-left"
    >
      <span>
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
          {label}
          {badge}
        </span>
        {description ? <span className="mt-1 block text-xs leading-5 text-muted">{description}</span> : null}
      </span>
      <span className={cx('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-cyan' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-midnight transition', checked ? 'left-5' : 'left-0.5')} />
      </span>
    </button>
  )
}
