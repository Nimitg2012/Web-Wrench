import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/context.ts'
import { DEMO_UPTIME_EVENTS, ISSUE_LINK, TUTORIAL_PAGE_CHOICES, demoAssistantReply } from '../data/demoData.ts'
import { Button, Card } from '../components/ui/Button.tsx'
import { controlClass } from '../components/ui/Overlay.tsx'
import { StatusBadge } from '../components/ui/Status.tsx'
import { Timeline } from '../components/ui/Timeline.tsx'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.ts'
import { cx } from '../utils/cx.ts'
import { tutorialContinueBlock } from '../utils/tutorial.ts'

const STEP_TITLES = [
  '',
  'Website overview',
  'Uptime monitoring',
  'Broken links',
  'Important page monitoring',
  'Form monitoring',
  'Checkout monitoring',
  'AI explanation',
  'Recovery',
  'Tutorial complete',
]

export function Tutorial() {
  const navigate = useNavigate()
  const { tutorial, patchTutorial, resetTutorial, selectWebsite, toast } = useApp()
  const reduce = usePrefersReducedMotion()
  const [offline, setOffline] = useState(reduce)
  const [follow, setFollow] = useState('')
  const step = tutorial.step

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [step, reduce])

  useEffect(() => {
    if (step !== 2) return
    setOffline(reduce)
    if (reduce) return
    const timer = window.setTimeout(() => setOffline(true), 900)
    return () => window.clearTimeout(timer)
  }, [step, reduce])

  const exit = () => navigate('/dashboard')
  const explore = () => {
    selectWebsite('demo')
    toast('Showing simulated demo data.', 'info')
    navigate('/dashboard')
  }

  if (step === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple">Demo mode</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome to Web Wrench</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">Learn how to protect your website in a few simple steps.</p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">These are simulated monitoring results. No real website is being monitored.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => patchTutorial({ step: 1 })}>Start tutorial</Button>
            <Button variant="secondary" onClick={explore}>Explore demo dashboard</Button>
            <Button variant="ghost" onClick={exit}>Exit tutorial</Button>
          </div>
        </Card>
        <div className="grid gap-3 sm:grid-cols-3">
          {['See a fictional store', 'Watch an outage recover', 'Read a plain-language explanation'].map((item) => (
            <div key={item} className="rounded-2xl border border-line bg-panel px-4 py-5 text-sm text-muted">{item}</div>
          ))}
        </div>
      </div>
    )
  }

  const blocked = tutorialContinueBlock(tutorial)

  const next = () => {
    if (blocked) return
    const following = Math.min(9, step + 1)
    patchTutorial({ step: following, completed: following === 9 })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple">Demo mode · Step {step} of 9</p>
          <h1 className="mt-1 text-2xl font-semibold">{STEP_TITLES[step]}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { resetTutorial(); toast('Tutorial restarted.', 'info') }}>Restart</Button>
          <Button variant="ghost" size="sm" onClick={exit}>Exit</Button>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-cyan" style={{ width: `${(step / 9) * 100}%` }} />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          {step === 1 ? <Overview /> : null}
          {step === 2 ? <UptimeStep offline={offline} /> : null}
          {step === 3 ? (
            <BrokenStep
              inspected={tutorial.inspectedLink}
              onInspect={() => patchTutorial({ inspectedLink: true })}
            />
          ) : null}
          {step === 4 ? (
            <PagesStep
              selected={tutorial.selectedPages}
              onToggle={(id) => {
                const selected = tutorial.selectedPages.includes(id)
                  ? tutorial.selectedPages.filter((item) => item !== id)
                  : [...tutorial.selectedPages, id]
                patchTutorial({ selectedPages: selected })
              }}
            />
          ) : null}
          {step === 5 ? <FormStep /> : null}
          {step === 6 ? <CheckoutStep revealed={tutorial.revealedCheckout} onReveal={() => patchTutorial({ revealedCheckout: true })} /> : null}
          {step === 7 ? (
            <AiStep
              follow={follow}
              replies={tutorial.followUps}
              onFollow={setFollow}
              onAsk={() => {
                const question = follow.trim()
                if (!question) return
                patchTutorial({
                  followUps: [...tutorial.followUps, { question, answer: demoAssistantReply(question, 'Checkout did not reach confirmation') }],
                })
                setFollow('')
              }}
            />
          ) : null}
          {step === 8 ? <RecoveryStep /> : null}
          {step === 9 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">You now know how Web Wrench helps protect your website.</h2>
              <p className="text-sm leading-6 text-muted">The store, outage, broken link, form, and checkout were all simulated. Your own website was not changed, and no alert was sent.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={explore}>Explore dashboard</Button>
                <Button variant="secondary" onClick={() => { resetTutorial(); toast('Tutorial restarted.', 'info') }}>Restart tutorial</Button>
                <Button variant="ghost" onClick={() => navigate('/websites/new')}>Add my website</Button>
              </div>
            </div>
          ) : null}
          {blocked ? <p className="text-sm text-warn">{blocked}</p> : null}
        </Card>
        <BrowserFrame>
          <Simulation step={step} offline={offline} inspected={tutorial.inspectedLink} pages={tutorial.selectedPages} revealed={tutorial.revealedCheckout} />
        </BrowserFrame>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => patchTutorial({ step: step - 1 })}>Previous</Button>
        {step < 9 ? <Button onClick={next} disabled={Boolean(blocked)}>Continue</Button> : <span className="text-sm text-muted">Tutorial complete</span>}
      </div>
    </div>
  )
}

function Overview() {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p className="text-base font-medium text-ink">Web Wrench checks your website to help identify problems before they affect your customers.</p>
      <p>This walkthrough uses demo-store.webwrench.app, a fictional online store.</p>
      <ul className="space-y-2">
        <li>Website URL: demo-store.webwrench.app</li>
        <li>Website health: online, with practice issues</li>
        <li>Uptime: 99.9% over a simulated 30 days</li>
        <li>Monitored pages: 12</li>
      </ul>
    </div>
  )
}

function UptimeStep({ offline }: { offline: boolean }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p className="text-base font-medium text-warn">Your website is temporarily unavailable.</p>
      <p>Web Wrench detected that the website did not respond successfully.</p>
      <p>{offline ? 'The simulation is now showing the outage.' : 'A check is in progress…'}</p>
      <p>Detection time: 5 hours ago in the tutorial clock. Response status: no successful response. The incident timeline is on the right.</p>
    </div>
  )
}

function BrokenStep({ inspected, onInspect }: { inspected: boolean; onInspect: () => void }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p>One product link does not open.</p>
      <button type="button" onClick={onInspect} className="w-full rounded-xl border border-line bg-midnight p-4 text-left">
        <span className="font-medium text-ink">/products/summer-collection</span>
        <span className="mt-1 block">Status: Broken link</span>
      </button>
      <p>This page could not be reached. Customers may not be able to access it.</p>
      {inspected ? (
        <div className="rounded-xl border border-line p-3">
          <p className="font-medium text-ink">Issue details</p>
          <p className="mt-1">Found on the products page. Simulated result: HTTP 404. No real catalog was changed.</p>
          <p className="mt-2 text-xs">Issue id {ISSUE_LINK}</p>
        </div>
      ) : (
        <p>Click the link above to inspect it.</p>
      )}
    </div>
  )
}

function PagesStep({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-muted">Choose the pages that matter most to your business.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {TUTORIAL_PAGE_CHOICES.map((page) => {
          const on = selected.includes(page.id)
          return (
            <button key={page.id} type="button" aria-pressed={on} onClick={() => onToggle(page.id)} className={cx('rounded-xl border px-3 py-3 text-left text-sm', on ? 'border-cyan/50 bg-cyan/10' : 'border-line')}>
              <span className="block font-medium">{page.name}</span>
              <span className="text-muted">{page.path}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FormStep() {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p className="text-base font-medium text-warn">Form submission could not be verified.</p>
      <div className="rounded-xl border border-line p-3">
        <p className="font-medium text-ink">What was observed</p>
        <ul className="mt-2 list-disc pl-4">
          <li>The contact form opened.</li>
          <li>The thank-you message did not appear.</li>
          <li>Email delivery was not verified.</li>
        </ul>
      </div>
      <div className="rounded-xl border border-line p-3">
        <p className="font-medium text-ink">Possible explanations, not observations</p>
        <ul className="mt-2 list-disc pl-4">
          <li>Form submission failed.</li>
          <li>Confirmation did not appear.</li>
          <li>Email delivery could not be verified.</li>
        </ul>
      </div>
    </div>
  )
}

function CheckoutStep({ revealed, onReveal }: { revealed: boolean; onReveal: () => void }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p>The tutorial walks through a product page, cart, checkout, and confirmation. It does not buy anything.</p>
      {!revealed ? <Button onClick={onReveal}>See what Web Wrench detected</Button> : <p className="font-medium text-warn">Web Wrench detected that the checkout workflow did not complete successfully.</p>}
    </div>
  )
}

function AiStep({
  follow,
  replies,
  onFollow,
  onAsk,
}: {
  follow: string
  replies: Array<{ question: string; answer: string }>
  onFollow: (value: string) => void
  onAsk: () => void
}) {
  return (
    <div className="space-y-3 text-sm leading-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple">Simulated explanation</p>
      <h2 className="text-base font-semibold">What happened?</h2>
      <p className="text-muted">The checkout process did not reach the expected confirmation page.</p>
      <p className="text-muted">Possible reasons include an unavailable payment service, a form error, or a failed redirect.</p>
      <p className="text-muted">Recommended next step: inspect the checkout error and verify the test environment.</p>
      {replies.map((reply) => (
        <div key={reply.question} className="rounded-xl border border-line p-3">
          <p className="text-xs text-muted">Simulated reply</p>
          <p className="mt-1">{reply.answer}</p>
        </div>
      ))}
      <div className="flex min-w-0 gap-2">
        <input className={`${controlClass} min-w-0 flex-1`} value={follow} onChange={(event) => onFollow(event.target.value)} placeholder="Ask a follow-up question" />
        <Button variant="ai" onClick={onAsk}>Ask</Button>
      </div>
    </div>
  )
}

function RecoveryStep() {
  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p className="text-base font-medium text-teal">Website recovered.</p>
      <p>Incident duration: 43 minutes. Recovery time: about 4 hours ago on the tutorial clock. Final uptime status: healthy.</p>
      <p>The checkout and contact form issues are still open. Recovery of the homepage does not close them.</p>
    </div>
  )
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-midnight shadow-card">
      <div className="flex items-center gap-2 border-b border-line bg-sidebar px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal/80" />
        <div className="ml-2 min-w-0 flex-1 truncate rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">demo-store.webwrench.app</div>
        <span className="rounded-full bg-purple/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple">Demo</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Simulation({
  step,
  offline,
  inspected,
  pages,
  revealed,
}: {
  step: number
  offline: boolean
  inspected: boolean
  pages: string[]
  revealed: boolean
}) {
  if (step === 2) {
    return (
      <div className="space-y-3">
        <StatusBadge status={offline ? 'critical' : 'healthy'} />
        <p className="text-sm text-muted">{offline ? 'No successful response.' : 'Homepage responding.'}</p>
        <Timeline events={DEMO_UPTIME_EVENTS.slice(0, offline ? 3 : 1)} />
      </div>
    )
  }
  if (step === 3) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-muted">Products page</p>
        <div className={cx('rounded-xl border p-3', inspected ? 'border-warn/40' : 'border-line')}>
          Summer collection
          <p className="text-muted">{inspected ? '404 · Broken link' : 'Link waiting for inspection'}</p>
        </div>
      </div>
    )
  }
  if (step === 4) {
    return (
      <ul className="space-y-2 text-sm">
        {TUTORIAL_PAGE_CHOICES.map((page) => (
          <li key={page.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
            {page.name}
            <span className="text-xs text-muted">{pages.includes(page.id) ? 'Selected' : 'Not selected'}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (step === 6 || step === 7) {
    const states = revealed || step === 7 ? ['Passed', 'Passed', 'Failed', 'Not reached'] : ['Waiting', 'Waiting', 'Waiting', 'Waiting']
    return (
      <ol className="grid grid-cols-2 gap-2 text-sm">
        {['Product page', 'Cart', 'Checkout', 'Confirmation'].map((name, index) => (
          <li key={name} className="rounded-xl border border-line p-3">
            <p>{name}</p>
            <p className="text-xs text-muted">{states[index]}</p>
          </li>
        ))}
      </ol>
    )
  }
  if (step === 8 || step === 9) {
    return (
      <div className="space-y-3">
        <StatusBadge status="healthy" pulse />
        <p className="text-sm text-muted">Homepage recovered. Duration 43 minutes.</p>
        <Timeline events={DEMO_UPTIME_EVENTS} />
      </div>
    )
  }
  return (
    <div className="space-y-3 text-sm">
      <StatusBadge status="warning" />
      <p className="text-lg font-semibold">Northwind Demo Store</p>
      <p className="text-muted">Online · 99.9% simulated uptime · 12 pages</p>
      <p className="text-muted">Open practice issues: checkout, contact form, summer collection.</p>
    </div>
  )
}
