import { Check, LoaderCircle } from '../components/ui/icons.tsx'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/context.ts'
import { checkWebsiteUrl } from '../services/aiService.ts'
import { defaultCheckout } from '../services/storage.ts'
import type { FeatureFlags, Reachability } from '../types/index.ts'
import { Button, Card, Eyebrow } from '../components/ui/Button.tsx'
import { controlClass, Field } from '../components/ui/Overlay.tsx'
import { createId, cx } from '../utils/cx.ts'
import { FREQUENCY_LABEL } from '../utils/format.ts'
import { canonicalWebsiteUrl, normalizeWebsiteUrl, validatePublicUrlShape } from '../utils/url.ts'

function initialWebsiteUrl() {
  const incoming = new URLSearchParams(window.location.search).get('url')
  if (!incoming) return 'https://'
  const normalized = normalizeWebsiteUrl(incoming)
  return validatePublicUrlShape(normalized) ? 'https://' : normalized
}

const FEATURES: Array<{ key: keyof FeatureFlags; title: string; body: string }> = [
  { key: 'uptime', title: 'Website uptime', body: 'Was the site answering?' },
  { key: 'brokenLinks', title: 'Broken links', body: 'Do important links open?' },
  { key: 'pages', title: 'Important pages', body: 'Check the pages you choose.' },
  { key: 'forms', title: 'Forms', body: 'Watch for a confirmation message.' },
  { key: 'checkout', title: 'Checkout', body: 'Follow a test checkout only.' },
]

export function AddWebsite() {
  const { addWebsite, state, toast, websites } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [url, setUrl] = useState(initialWebsiteUrl)
  const [name, setName] = useState('')
  const [urlError, setUrlError] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const [checkCode, setCheckCode] = useState('')
  const [result, setResult] = useState<Reachability | null>(null)
  const [features, setFeatures] = useState<FeatureFlags>({
    uptime: true,
    brokenLinks: true,
    pages: true,
    forms: true,
    checkout: true,
  })

  useEffect(() => {
    if (step !== 2) return
    const controller = new AbortController()
    let active = true
    setChecking(true)
    setCheckError('')
    setCheckCode('')
    setResult(null)
    void checkWebsiteUrl(url.trim(), controller.signal)
      .then((value) => {
        if (!active) return
        setResult({
          checkedAt: value.checkedAt,
          ok: value.ok,
          httpStatus: value.httpStatus,
          responseTimeMs: value.responseTimeMs,
          finalUrl: value.finalUrl,
          message: value.message,
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        const coded = error as Error & { code?: string }
        setCheckCode(coded.code ?? 'UNREACHABLE')
        setCheckError(coded instanceof Error ? coded.message : 'The setup check failed.')
      })
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [step, url])

  const blocked = checkCode === 'BLOCKED' || checkCode === 'INVALID'
  const canLeaveCheck = !checking && (Boolean(result) || (Boolean(checkError) && !blocked))

  const startCheck = () => {
    const normalized = normalizeWebsiteUrl(url)
    const error = validatePublicUrlShape(normalized)
    if (error) {
      setUrlError(error)
      return
    }
    if (websites.some((website) => canonicalWebsiteUrl(website.url) === canonicalWebsiteUrl(normalized))) {
      setUrlError('That website is already saved.')
      return
    }
    setUrl(normalized)
    setUrlError('')
    if (!name.trim()) {
      setName(new URL(normalized).hostname.replace(/^www\./, ''))
    }
    setStep(2)
  }

  const save = () => {
    const normalized = normalizeWebsiteUrl(url)
    if (websites.some((website) => canonicalWebsiteUrl(website.url) === canonicalWebsiteUrl(normalized))) {
      setUrlError('That website is already saved.')
      setStep(1)
      return
    }
    const websiteName = name.trim() || new URL(normalized).hostname
    const added = addWebsite({
      id: createId('site'),
      name: websiteName,
      url: normalized,
      isDemo: false,
      addedAt: new Date().toISOString(),
      features,
      pages: features.pages
        ? [{ id: createId('page'), name: 'Homepage', path: '/', frequency: state.monitoringPrefs.defaultFrequency }]
        : [],
      forms: [],
      checkout: { ...defaultCheckout(), environmentUrl: '' },
      reachability: result ?? {
        checkedAt: new Date().toISOString(),
        ok: false,
        httpStatus: null,
        responseTimeMs: null,
        finalUrl: normalized,
        message: checkError || 'No setup check was stored.',
      },
    })
    if (!added) {
      setUrlError('That website is already saved.')
      setStep(1)
      return
    }
    toast('Website added. The server will run the first check shortly.', 'success')
    setStep(6)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Eyebrow>Step {Math.min(step, 6)} of 6</Eyebrow>
        <h1 className="mt-2 text-2xl font-semibold">Add my website</h1>
        <p className="mt-1 text-sm text-muted">You do not need to paste any website code. This setup is saved on this device.</p>
      </div>
      <ol className="grid grid-cols-6 gap-2" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className={cx('h-1.5 rounded-full', index < step ? 'bg-cyan' : 'bg-line')} />
        ))}
      </ol>
      {step === 1 ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Enter your website URL.</h2>
          <Field label="Website name" hint="Shown in the website menu.">
            <input className={controlClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Northwind Studio" />
          </Field>
          <Field label="Website URL" error={urlError} hint="Example: https://example.com">
            <input className={controlClass} value={url} onChange={(event) => setUrl(event.target.value)} inputMode="url" autoComplete="url" />
          </Field>
          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={() => navigate('/websites')}>Cancel</Button>
            <Button onClick={startCheck}>Continue</Button>
          </div>
        </Card>
      ) : null}
      {step === 2 ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Validate the URL.</h2>
          <p className="text-sm leading-6 text-muted">Web Wrench makes one public request. Private, local, and metadata addresses are refused. This does not start monitoring.</p>
          {checking ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Checking whether the public address responds…
            </p>
          ) : null}
          {result ? (
            <div className="rounded-xl border border-line bg-midnight p-4 text-sm">
              <p className="font-medium text-ink">{result.ok ? 'The address responded.' : 'The address responded with an error page.'}</p>
              <p className="mt-2 text-muted">{result.message}</p>
              <p className="mt-2 text-xs break-all text-muted">
                HTTP {result.httpStatus ?? '—'} · {result.responseTimeMs ?? '—'} ms · {result.finalUrl}
              </p>
            </div>
          ) : null}
          {checkError ? <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{checkError}</p> : null}
          {!checking && checkError && !blocked ? (
            <p className="text-sm text-muted">You can still save the website. Continuous monitoring will not start, and there will be no live results.</p>
          ) : null}
          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={!canLeaveCheck} onClick={() => setStep(3)}>Continue</Button>
          </div>
        </Card>
      ) : null}
      {step === 3 ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Website setup preview</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-midnight p-3"><dt className="text-xs text-muted">Name</dt><dd className="mt-1">{name}</dd></div>
            <div className="rounded-xl bg-midnight p-3"><dt className="text-xs text-muted">URL</dt><dd className="mt-1 break-all">{url}</dd></div>
          </dl>
          <p className="text-sm text-muted">Status after saving: the server stores the website and checks it on a schedule.</p>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)}>Continue</Button>
          </div>
        </Card>
      ) : null}
      {step === 4 ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Choose monitoring features.</h2>
          <div className="grid gap-2">
            {FEATURES.map((feature) => {
              const on = features[feature.key]
              return (
                <button
                  key={feature.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFeatures((current) => ({ ...current, [feature.key]: !current[feature.key] }))}
                  className={cx('flex items-center justify-between rounded-xl border px-4 py-3 text-left', on ? 'border-cyan/50 bg-cyan/10' : 'border-line bg-midnight')}
                >
                  <span>
                    <span className="block text-sm font-medium">{feature.title}</span>
                    <span className="block text-xs text-muted">{feature.body}</span>
                  </span>
                  {on ? <Check className="h-4 w-4 text-cyan" /> : null}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
            <Button onClick={() => setStep(5)} disabled={!Object.values(features).some(Boolean)}>Continue</Button>
          </div>
        </Card>
      ) : null}
      {step === 5 ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Monitoring configuration</h2>
          <p className="text-sm leading-6 text-muted">
            New pages use {FREQUENCY_LABEL[state.monitoringPrefs.defaultFrequency]}. Preferences are saved here. No schedule is running, and no alerts will be sent.
          </p>
          <ul className="space-y-2 text-sm text-muted">
            <li>Your setup stays in this browser.</li>
            <li>The reachability result was a single setup check.</li>
            <li>Checkout will never place an order from this screen.</li>
          </ul>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
            <Button onClick={save}>Save website</Button>
          </div>
        </Card>
      ) : null}
      {step === 6 ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Website added. The first check will run shortly.</h2>
          <p className="text-sm leading-6 text-muted">
            {name} is saved on the server. Uptime, pages, and links are checked on a schedule. Form tests and checkout automation still do not run.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
            <Button variant="secondary" onClick={() => navigate('/monitoring')}>Review monitoring setup</Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
