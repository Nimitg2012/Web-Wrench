import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { normalizeWebsiteUrl, validatePublicUrlShape } from '../utils/url.ts'

const NAV = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How It Works' },
  { id: 'about', label: 'About' },
]

export function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Web Wrench'
  }, [])

  const goTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const start = (raw: string) => {
    const normalized = normalizeWebsiteUrl(raw)
    const message = validatePublicUrlShape(normalized)
    if (message) {
      setError(message)
      return
    }
    setError('')
    navigate(`/websites/new?url=${encodeURIComponent(normalized)}`)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    start(url)
  }

  return (
    <div className="h-full overflow-x-hidden overflow-y-auto bg-midnight text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-midnight/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/favicon.png" alt="" className="h-9 w-9 rounded-xl" />
            <span className="truncate text-sm font-semibold tracking-tight">Web Wrench</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Introduction">
            {NAV.map((item) => (
              <button key={item.id} type="button" onClick={() => goTo(item.id)} className="rounded-full px-3 py-2 text-sm text-muted hover:bg-panel hover:text-ink">
                {item.label}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/dashboard" className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-teal/50">
              Dashboard
            </Link>
            <Link to="/websites/new" className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-midnight hover:bg-teal/90">
              Get Started
            </Link>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-line md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span className="block h-0.5 w-4 bg-ink" />
            <span className="mt-1 block h-0.5 w-4 bg-ink" />
            <span className="mt-1 block h-0.5 w-4 bg-ink" />
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <button key={item.id} type="button" onClick={() => goTo(item.id)} className="rounded-xl px-3 py-3 text-left text-sm text-ink hover:bg-panel">
                  {item.label}
                </button>
              ))}
              <Link to="/dashboard" className="rounded-xl px-3 py-3 text-sm text-ink hover:bg-panel" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/websites/new" className="mt-1 rounded-full bg-teal px-4 py-3 text-center text-sm font-semibold text-midnight" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="page-enter mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-16 pb-8 text-center sm:px-6 sm:pt-24">
          <p className="max-w-full text-xs font-semibold tracking-[0.12em] text-teal sm:tracking-[0.18em]">WEBSITE MONITORING MADE SIMPLE</p>
          <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-white min-[420px]:text-5xl sm:text-6xl">
            Your Website.
            <span className="mt-1 block text-teal">Under Watch.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            Monitor your website, detect problems, and stay informed when something goes wrong. Web Wrench helps you keep your website running smoothly without complicated technical tools.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/websites/new" className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-midnight hover:bg-teal/90">
              Start Monitoring
            </Link>
            <button type="button" onClick={() => goTo('features')} className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-teal/50">
              Explore Features
            </button>
          </div>
          <form onSubmit={onSubmit} className="mt-8 w-full max-w-xl">
            <label htmlFor="website-url" className="sr-only">Website URL</label>
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-2 sm:flex-row sm:rounded-full sm:p-1.5">
              <input
                id="website-url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter your website URL (e.g. example.com)"
                autoComplete="url"
                inputMode="url"
                className="min-h-11 w-full bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted/70"
              />
              <button type="submit" className="min-h-11 shrink-0 rounded-xl bg-teal px-5 text-sm font-semibold text-midnight hover:bg-teal/90 sm:rounded-full">
                Start Monitoring
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : <p className="mt-3 text-xs text-muted">You will confirm the website in the existing add-website flow. Monitoring starts only after it is saved.</p>}
          </form>
        </section>

        <section id="features" className="scroll-mt-20 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">What Web Wrench does</h2>
            <p className="mt-3 text-sm leading-6 text-muted">These are the tools already in the app. Nothing here is a promise of a feature that is still missing.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-line bg-panel p-5">
                <feature.icon />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-y border-line bg-sidebar/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">How it works</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Three steps, using the monitoring that is already built.</p>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.number} className="rounded-2xl border border-line bg-panel p-5">
                  <p className="text-sm font-semibold text-teal">Step {step.number}</p>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="about" className="scroll-mt-20 mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">About Web Wrench</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Web Wrench is a local website monitor. It checks whether a public site answers, looks at saved pages and links, and keeps the results you can open later. When something looks wrong, the Issue Center shows the stored evidence, and the AI assistant can explain that evidence in plain language.
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Checks run while the Web Wrench server is running. Email, SMS, and WhatsApp alerts are not sent.
          </p>
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-panel px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">Keep Your Website Under Watch.</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">Start monitoring your website and make website problems easier to understand.</p>
            <Link to="/websites/new" className="mt-6 inline-flex rounded-full bg-teal px-6 py-3 text-sm font-semibold text-midnight hover:bg-teal/90">
              Get Started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-semibold">Web Wrench</p>
            <p className="mt-1 text-sm text-muted">Your Website. Under Watch.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Footer">
            <button type="button" onClick={() => goTo('features')} className="hover:text-ink">Features</button>
            <button type="button" onClick={() => goTo('how')} className="hover:text-ink">How It Works</button>
            <button type="button" onClick={() => goTo('about')} className="hover:text-ink">About</button>
            <Link to="/dashboard" className="hover:text-ink">Dashboard</Link>
            <Link to="/websites" className="hover:text-ink">Websites</Link>
            <Link to="/issues" className="hover:text-ink">Issues</Link>
            <Link to="/assistant" className="hover:text-ink">AI Assistant</Link>
          </nav>
        </div>
        <p className="px-4 pb-8 text-center text-xs text-muted sm:px-6">© {new Date().getFullYear()} Web Wrench</p>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    title: 'Website monitoring',
    body: 'Check whether a public website answers, and keep each stored result.',
    icon: PulseIcon,
  },
  {
    title: 'Issue detection',
    body: 'Open confirmed problems in the Issue Center, including the status and the page that was checked.',
    icon: AlertIcon,
  },
  {
    title: 'Website health',
    body: 'See the latest stored check, response time, and uptime once enough checks have been saved.',
    icon: HeartIcon,
  },
  {
    title: 'AI explanations',
    body: 'Ask the assistant to explain a stored issue in plain language. It uses the evidence already on record.',
    icon: SparkIcon,
  },
  {
    title: 'A clear dashboard',
    body: 'Review websites, recent checks, and open issues from one screen.',
    icon: BoardIcon,
  },
  {
    title: 'Simple website management',
    body: 'Add a public website, pause checks, or remove it from the websites page.',
    icon: GlobeIcon,
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Add your website',
    body: 'Enter a public website URL and save it through the existing add-website flow.',
  },
  {
    number: '2',
    title: 'Check your website',
    body: 'While the Web Wrench server is running, it stores uptime, page, and link checks for that site.',
  },
  {
    number: '3',
    title: 'Understand website issues',
    body: 'Read the stored result in the Issue Center, and use the assistant when you want a plain-language explanation.',
  },
]

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3 12h4l2-5 4 10 2-5h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 4 3.5 19h17L12 4Z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" strokeLinejoin="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" strokeLinecap="round" />
    </svg>
  )
}

function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.4 2.2 13.6 0 16M12 4c-2.2 2.4-2.2 13.6 0 16" />
    </svg>
  )
}
