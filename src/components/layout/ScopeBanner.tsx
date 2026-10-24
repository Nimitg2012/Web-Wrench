import { useApp } from '../../context/context.ts'
import { Banner, DemoBanner } from '../ui/Status.tsx'

export function ScopeBanner() {
  const { selected } = useApp()
  if (!selected) return null
  if (selected.isDemo) return <DemoBanner />
  return (
    <Banner>
      Checks are stored by the server on this computer. They keep running when this tab is closed, and they stop if the Web Wrench server stops. Email, SMS, and WhatsApp are not sent.
    </Banner>
  )
}

export function NoWebsite({ title, body }: { title: string; body: string }) {
  return (
    <Banner>
      <span className="font-medium text-ink">{title}</span> {body}
    </Banner>
  )
}
