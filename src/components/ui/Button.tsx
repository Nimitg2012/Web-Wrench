import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-cyan text-midnight hover:bg-cyan/90 shadow-glow',
  secondary: 'border border-line bg-panel-2 text-ink hover:border-cyan/50',
  ghost: 'text-muted hover:bg-panel-2 hover:text-ink',
  danger: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15',
  ai: 'border border-purple/40 bg-purple/10 text-purple hover:bg-purple/15',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan',
    variants[variant],
    sizes[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-panel p-4 shadow-card sm:p-5', className)}>
      {children}
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{children}</p>
}
