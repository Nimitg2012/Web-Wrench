import { useState } from 'react'
import { ScopeBanner } from '../components/layout/ScopeBanner.tsx'
import { MonitoringNav } from '../components/monitoring/MonitoringNav.tsx'
import { useApp } from '../context/context.ts'
import { formReport } from '../services/monitoringService.ts'
import { Button, Card } from '../components/ui/Button.tsx'
import { controlClass, EmptyState, Field } from '../components/ui/Overlay.tsx'
import { DemoTag, StatusBadge } from '../components/ui/Status.tsx'
import { createId } from '../utils/cx.ts'
import { formatRelative } from '../utils/format.ts'
import { validatePublicUrlShape } from '../utils/url.ts'

export function FormsPage() {
  const app = useApp()
  const { selected, addForm, removeForm, toast, updateWebsite, mode } = app
  const forms = formReport(selected, app.state.demoSandbox)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [expected, setExpected] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  if (!selected) return <EmptyState icon={<span className="text-sm">@</span>} title="No website selected" body="Choose a website before configuring a form." />
  if (!selected.isDemo && !selected.features.forms) {
    return (
      <EmptyState icon={<span className="text-sm">@</span>} title="Form checks are off" body="Saving this preference does not submit any form.">
        <Button onClick={() => updateWebsite(selected.id, { features: { ...selected.features, forms: true } })}>Save this preference</Button>
      </EmptyState>
    )
  }

  const save = () => {
    if (!name.trim()) {
      setError('Name the form so you can recognize it.')
      return
    }
    const urlError = validatePublicUrlShape(url.trim())
    if (urlError) {
      setError(urlError)
      return
    }
    if (!expected.trim()) {
      setError('Describe the confirmation you expect, such as a thank-you message.')
      return
    }
    addForm({
      id: createId('form'),
      name: name.trim(),
      url: url.trim(),
      expectedConfirmation: expected.trim(),
      notes: notes.trim(),
    })
    setName('')
    setUrl('')
    setExpected('')
    setNotes('')
    setError('')
    toast('Form configuration saved. No test was submitted.', 'success')
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Form monitoring</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Tell Web Wrench which form to watch and what a successful confirmation looks like. Customer data is never submitted from this page.</p>
      </div>
      <ScopeBanner />
      <MonitoringNav />
      <Card className="grid gap-3">
        <h2 className="font-semibold">Add a form</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Form name"><input className={controlClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Contact form" /></Field>
          <Field label="Form URL"><input className={controlClass} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/contact" /></Field>
        </div>
        <Field label="Expected confirmation" error={error}>
          <input className={controlClass} value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="Thanks, we received your message." />
        </Field>
        <Field label="Optional note" hint="Do not put customer messages or passwords here.">
          <textarea className={controlClass} rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save}>Save form</Button>
          <Button variant="secondary" disabled title="Form tests are not connected">Run test · Not available</Button>
        </div>
        <p className="text-xs text-muted">Tests are not available. Email delivery is not verified.</p>
      </Card>
      {forms.length === 0 ? (
        <EmptyState icon={<span className="text-sm">@</span>} title="No forms configured" body="Save a form if you want it included once monitoring exists." />
      ) : (
        forms.map((form) => (
          <Card key={form.id}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{form.name}</h2>
              <StatusBadge status={form.status} />
              {form.simulated ? <DemoTag /> : null}
            </div>
            <p className="mt-2 break-all text-sm text-muted">{form.url}</p>
            <p className="mt-3 text-sm">{form.result}</p>
            <p className="mt-1 text-xs text-muted">{form.lastTest ? `Last test ${formatRelative(form.lastTest)}` : 'No test has run'}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-midnight p-3">
                <h3 className="text-sm font-medium">Observed</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">{form.observed.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="rounded-xl border border-line bg-midnight p-3">
                <h3 className="text-sm font-medium">Possible explanations</h3>
                {form.possibleCauses.length === 0 ? <p className="mt-2 text-sm text-muted">None. A cause should not be guessed without a test.</p> : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">{form.possibleCauses.map((item) => <li key={item}>{item}</li>)}</ul>
                )}
              </div>
            </div>
            {mode === 'advanced' ? <p className="mt-3 text-xs text-muted">Expected confirmation: {form.expectedConfirmation}</p> : null}
            {form.id !== 'contact-form' ? (
              <Button className="mt-4" size="sm" variant="danger" onClick={() => removeForm(form.id)}>Remove</Button>
            ) : (
              <p className="mt-4 text-xs text-purple">This contact form is part of the tutorial simulation.</p>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
