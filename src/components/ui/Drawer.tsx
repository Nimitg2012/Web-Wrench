import { useEffect, type ReactNode } from 'react'

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-midnight/70" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="drawer-in flex h-full w-full max-w-md flex-col border-l border-line bg-sidebar shadow-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  )
}
