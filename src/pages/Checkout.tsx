import { useState } from 'react'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { MonitoringNav } from '../components/monitoring/MonitoringNav.tsx'
import { Banner } from '../components/ui/Status.tsx'
import { useApp } from '../context/context.ts'
import { checkoutSetup, checkoutView } from '../services/monitoringService.ts'
import { Button, Card } from '../components/ui/Button.tsx'
import { controlClass, EmptyState, Field } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { cx } from '../utils/cx.ts'
import { validatePublicUrlShape } from '../utils/url.ts'

export function CheckoutPage() {
  const { selected, updateWebsite } = useApp()
  if (!selected) return <EmptyState icon={<span className="text-sm">$</span>} title="No website selected" body="Choose a website before describing a checkout test." />
  if (!selected.isDemo && !selected.features.checkout) {
    return (
      <EmptyState icon={<span className="text-sm">$</span>} title="Checkout checks are off" body="You can save the preference. Web Wrench will not place an order.">
        <Button onClick={() => updateWebsite(selected.id, { features: { ...selected.features, checkout: true } })}>Save this preference</Button>
      </EmptyState>
    )
  }
  return <CheckoutEditor key={selected.id} />
}

function CheckoutEditor() {
  const app = useApp()
  const { selected, saveCheckout, toast } = app
  const view = checkoutView(selected)
  const stored = checkoutSetup(selected, app.state.demoSandbox)
  const [environmentUrl, setEnvironmentUrl] = useState(stored.environmentUrl)
  const [label, setLabel] = useState(stored.testAccountLabel)
  const [steps, setSteps] = useState(stored.steps)
  const [error, setError] = useState('')
  if (!selected) return null

  const save = () => {
    if (environmentUrl.trim()) {
      const urlError = validatePublicUrlShape(environmentUrl.trim())
      if (urlError) {
        setError(urlError)
        return
      }
    }
    const cleanSteps = steps.map((step) => step.trim()).filter(Boolean)
    if (cleanSteps.length < 2) {
      setError('Keep at least two steps, such as Cart and Confirmation.')
      return
    }
    saveCheckout({ environmentUrl: environmentUrl.trim(), testAccountLabel: label.trim(), steps: cleanSteps })
    setError('')
    toast('Checkout configuration saved. No order was submitted.', 'success')
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Checkout monitoring</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Describe a test environment and the steps a successful checkout should pass. This page never charges a customer or submits an order.</p>
      </div>
      <Banner tone="warning">Configuration preview. Checkout testing is not running.</Banner>
      <ScopeBanner />
      <MonitoringNav />
      {view.simulated ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Simulated workflow</h2>
            <DemoTag />
          </div>
          <p className="mt-2 text-sm text-muted">{view.summary}</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {view.steps.map((step) => (
              <li key={step.name} className={cx('rounded-xl border p-3', step.state === 'failed' ? 'border-danger/40' : step.state === 'not_reached' ? 'border-line' : 'border-teal/30')}>
                <StatusBadge status={step.state === 'passed' ? 'healthy' : step.state === 'failed' ? 'critical' : 'unknown'} />
                <p className="mt-3 font-medium">{step.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{step.detail}</p>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold">Workflow status</h2>
          <p className="mt-2 text-sm text-muted">There is no checkout result. Automation is not connected, so no step has been tested.</p>
        </Card>
      )}
      <Card className="space-y-3">
        <h2 className="font-semibold">Test setup</h2>
        <Field label="Test environment URL" hint="Use a staging site if you have one. Leave blank to skip." error={error}>
          <input className={controlClass} value={environmentUrl} onChange={(event) => setEnvironmentUrl(event.target.value)} placeholder="https://staging.example.com" />
        </Field>
        <Field label="Test account label" hint="A nickname only. Do not enter a password or card number.">
          <input className={controlClass} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Staging shopper" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <Field key={index} label={`Step ${index + 1}`}>
              <input
                className={controlClass}
                value={step}
                onChange={(event) => setSteps((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
              />
            </Field>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={save}>Save configuration</Button>
          <Button variant="secondary" disabled>Run checkout test · Not available</Button>
        </div>
      </Card>
    </div>
  )
}
