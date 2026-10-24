import { useState } from 'react'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { MonitoringNav } from '../components/monitoring/MonitoringNav.tsx'
import { useApp } from '../context/context.ts'
import { pageReport } from '../services/monitoringService.ts'
import type { Frequency } from '../types/index.ts'
import { Button, Card } from '../components/ui/Button.tsx'
import { controlClass, EmptyState, Field } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { createId } from '../utils/cx.ts'
import { formatRelative, FREQUENCY_LABEL, FREQUENCY_OPTIONS } from '../utils/format.ts'
import { validatePagePath } from '../utils/url.ts'

export function ImportantPages() {
  const app = useApp()
  const { selected, addPage, removePage, setPageFrequency, toast, updateWebsite } = app
  const pages = pageReport(selected, app.state.demoSandbox)
  const [name, setName] = useState('')
  const [path, setPath] = useState('/')
  const [error, setError] = useState('')

  if (!selected) return <EmptyState icon={<span className="text-sm">/</span>} title="No website selected" body="Choose a website before saving pages." />
  if (!selected.isDemo && !selected.features.pages) {
    return (
      <EmptyState icon={<span className="text-sm">/</span>} title="Page checks are off" body="Turn page checks on to include these addresses in the server schedule.">
        <Button onClick={() => updateWebsite(selected.id, { features: { ...selected.features, pages: true } })}>Save this preference</Button>
      </EmptyState>
    )
  }

  const onAdd = () => {
    const pathError = validatePagePath(path)
    if (!name.trim()) {
      setError('Give the page a name, such as Contact.')
      return
    }
    if (pathError) {
      setError(pathError)
      return
    }
    if (pages.some((page) => page.path === path.trim())) {
      setError('That page is already in the list.')
      return
    }
    addPage({
      id: createId('page'),
      name: name.trim(),
      path: path.trim(),
      frequency: app.state.monitoringPrefs.defaultFrequency,
    })
    setName('')
    setPath('/')
    setError('')
    toast(selected.isDemo ? 'Page added to the demo sandbox. It is not being monitored.' : 'Page saved. It has not been checked.', 'success')
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Important pages</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">These are the pages you want Web Wrench to check regularly. Examples: homepage, contact, booking, products, and registration.</p>
      </div>
      <ScopeBanner />
      <MonitoringNav />
      <Card className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Page name">
          <input className={controlClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Contact" />
        </Field>
        <Field label="Path" error={error}>
          <input className={controlClass} value={path} onChange={(event) => setPath(event.target.value)} placeholder="/contact" />
        </Field>
        <Button onClick={onAdd}>Add page</Button>
      </Card>
      {pages.length === 0 ? (
        <EmptyState icon={<span className="text-sm">/</span>} title="No pages saved" body="Add the homepage or another path you care about." />
      ) : (
        <div className="grid gap-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{page.name}</h2>
                    <StatusBadge status={page.status} />
                    {page.simulated ? <DemoTag /> : null}
                  </div>
                  <p className="mt-1 text-sm break-all text-muted">{page.path}</p>
                  <p className="mt-1 text-sm text-muted">{page.detail}</p>
                  <p className="mt-1 text-xs text-muted">{page.lastChecked ? `Last checked ${formatRelative(page.lastChecked)}` : 'Not checked yet'}</p>
                </div>
                <label className="text-xs text-muted">
                  Frequency
                  <select
                    className={`${controlClass} mt-1`}
                    value={page.frequency}
                    aria-label={`Frequency for ${page.name}`}
                    onChange={(event) => {
                      setPageFrequency(page.id, event.target.value as Frequency)
                      toast('Check frequency saved on this device.', 'success')
                    }}
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{FREQUENCY_LABEL[option]}</option>
                    ))}
                  </select>
                </label>
                <Button size="sm" variant="danger" onClick={() => removePage(page.id)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
