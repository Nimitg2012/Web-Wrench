import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function Activity(props: IconProps) {
  return <Icon {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Icon>
}
export function AlertTriangle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  )
}
export function ArrowRight(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>
}
export function Bell(props: IconProps) {
  return <Icon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>
}
export function Check(props: IconProps) {
  return <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon>
}
export function ChevronDown(props: IconProps) {
  return <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon>
}
export function Copy(props: IconProps) {
  return <Icon {...props}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Icon>
}
export function FileText(props: IconProps) {
  return <Icon {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M8 13h8" /><path d="M8 17h8" /></Icon>
}
export function Globe(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>
}
export function GraduationCap(props: IconProps) {
  return <Icon {...props}><path d="M21.4 8.4 12 4 2.6 8.4 12 12.8l9.4-4.4Z" /><path d="M6 10.5V16c0 .8 2.7 2.5 6 2.5s6-1.7 6-2.5v-5.5" /></Icon>
}
export function LayoutDashboard(props: IconProps) {
  return <Icon {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></Icon>
}
export function Link2(props: IconProps) {
  return <Icon {...props}><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><path d="M8 12h8" /></Icon>
}
export function LoaderCircle(props: IconProps) {
  return <Icon {...props}><path d="M21 12a9 9 0 1 1-6.2-8.6" /></Icon>
}
export function Menu(props: IconProps) {
  return <Icon {...props}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icon>
}
export function PanelLeftClose(props: IconProps) {
  return <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" /></Icon>
}
export function PanelLeftOpen(props: IconProps) {
  return <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" /></Icon>
}
export function Plus(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>
}
export function RefreshCw(props: IconProps) {
  return <Icon {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M8 16H3v5" /></Icon>
}
export function Search(props: IconProps) {
  return <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
}
export function Send(props: IconProps) {
  return <Icon {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>
}
export function Settings(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Icon>
  )
}
export function ShoppingCart(props: IconProps) {
  return <Icon {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.1 2.1h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6l1.4-7.4H6" /></Icon>
}
export function Sparkles(props: IconProps) {
  return <Icon {...props}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="M19 14l.7 1.8L21.5 16.5 19.7 17.2 19 19l-.7-1.8-1.8-.7 1.8-.7L19 14Z" /></Icon>
}
export function SquareMousePointer(props: IconProps) {
  return <Icon {...props}><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="m12 12 9 3-4 1-1 4-4-8Z" /></Icon>
}
export function Timer(props: IconProps) {
  return <Icon {...props}><path d="M10 2h4" /><path d="M12 14V8" /><circle cx="12" cy="14" r="8" /></Icon>
}
export function Trash2(props: IconProps) {
  return <Icon {...props}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></Icon>
}
export function Wrench(props: IconProps) {
  return <Icon {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-8.3 7.1L6.4 19.4a2 2 0 0 1-3-3l6.1-6.1A6 6 0 0 1 16.6 2l-1.9 4.3Z" /></Icon>
}
export function X(props: IconProps) {
  return <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
}
