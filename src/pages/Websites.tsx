import { Plus, Trash2 } from '../components/ui/icons.tsx'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/context.ts'
import { buttonClasses, Card } from '../components/ui/Button.tsx'
import { EmptyState, Modal } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { monitorHealth } from '../services/monitoringService.ts'
import { formatDate } from '../utils/format.ts'

export function Websites() {
  const { websites, selectWebsite, removeWebsite, setPaused, toast } = useApp()
  const navigate = useNavigate()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pending = websites.find((website) => website.id === pendingId)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My websites</h1>
          <p className="mt-1 text-sm text-muted">Real websites are stored on the server. The demo store stays separate.</p>
        </div>
        <Link to="/websites/new" className={buttonClasses('primary')}>
          <Plus className="h-4 w-4" />
          Add my website
        </Link>
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Northwind Demo Store</h2>
          <DemoTag />
        </div>
        <p className="mt-2 text-sm text-muted">demo-store.webwrench.app · fictional tutorial website</p>
        <button
          type="button"
          className={`${buttonClasses('secondary', 'sm')} mt-4`}
          onClick={() => {
            selectWebsite('demo')
            navigate('/dashboard')
          }}
        >
          Open demo dashboard
        </button>
      </Card>
      {websites.length === 0 ? (
        <EmptyState icon={<Plus className="h-5 w-5" />} title="No websites saved yet" body="Adding a website saves it on the server and starts scheduled checks.">
          <Link to="/websites/new" className={buttonClasses('primary')}>Add my website</Link>
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {websites.map((website) => (
            <Card key={website.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{website.name}</h2>
                    <StatusBadge status={monitorHealth(website.monitorState)} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{website.url}</p>
                  <p className="mt-2 text-xs text-muted">Added {formatDate(website.addedAt)} · {website.paused ? 'Monitoring paused' : `Scheduled every ${website.frequency ?? '15m'}`}</p>
                  {website.reachability ? <p className="mt-2 text-sm text-muted">{website.reachability.message}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    {Object.entries(website.features)
                      .filter(([, enabled]) => enabled)
                      .map(([feature]) => (
                        <span key={feature} className="rounded-full border border-line px-2 py-1">{featureLabel(feature)}</span>
                      ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonClasses('secondary', 'sm')} onClick={() => setPaused(website.id, !website.paused)}>
                    {website.paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    className={buttonClasses('secondary', 'sm')}
                    onClick={() => {
                      selectWebsite(website.id)
                      navigate('/dashboard')
                    }}
                  >
                    Dashboard
                  </button>
                  <button type="button" className={buttonClasses('danger', 'sm')} onClick={() => setPendingId(website.id)} aria-label={`Remove ${website.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={Boolean(pending)} title="Remove this website?" onClose={() => setPendingId(null)}>
        <p className="text-sm leading-6 text-muted">
          This deletes the saved setup for {pending?.name ?? 'this website'} from this browser. Nothing is changed on the website itself.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClasses('ghost', 'sm')} onClick={() => setPendingId(null)}>Cancel</button>
          <button
            type="button"
            className={buttonClasses('danger', 'sm')}
            onClick={() => {
              if (!pending) return
              removeWebsite(pending.id)
              toast(`${pending.name} was removed from this device.`, 'success')
              setPendingId(null)
            }}
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  )
}

function featureLabel(feature: string) {
  const labels: Record<string, string> = {
    uptime: 'Uptime',
    brokenLinks: 'Broken links',
    pages: 'Important pages',
    forms: 'Forms',
    checkout: 'Checkout',
  }
  return labels[feature] ?? feature
}
