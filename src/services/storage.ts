import type {
  CheckoutSetup,
  DemoSandbox,
  ExperienceMode,
  FeatureFlags,
  Frequency,
  IssueStatus,
  MonitoringPrefs,
  NotificationPrefs,
  Profile,
  Reachability,
  SavedForm,
  SavedPage,
  TutorialState,
  Website,
} from '../types/index.ts'
import { FREQUENCY_OPTIONS } from '../utils/format.ts'
import { validatePublicUrlShape } from '../utils/url.ts'

const KEY = 'webwrench.v1'

export interface PersistedState {
  websites: Website[]
  selectedId: string | null
  mode: ExperienceMode
  profile: Profile
  notifications: NotificationPrefs
  monitoringPrefs: MonitoringPrefs
  issueStates: Record<string, IssueStatus>
  demoSandbox: DemoSandbox
  tutorial: TutorialState
  sidebarCollapsed: boolean
}

export const defaultCheckout = (): CheckoutSetup => ({
  environmentUrl: '',
  testAccountLabel: '',
  steps: ['Product page', 'Cart', 'Checkout', 'Confirmation'],
})

export const defaultState = (): PersistedState => ({
  websites: [],
  selectedId: null,
  mode: 'beginner',
  profile: { name: '', email: '' },
  notifications: { email: true, sms: false, whatsapp: false },
  monitoringPrefs: { defaultFrequency: '1m', alertOnWarning: true, alertOnCritical: true },
  issueStates: {},
  demoSandbox: {
    hiddenPageIds: [],
    extraPages: [],
    pageFrequency: {},
    extraForms: [],
    removedFormIds: [],
    checkout: defaultCheckout(),
  },
  tutorial: {
    step: 0,
    selectedPages: [],
    inspectedLink: false,
    revealedCheckout: false,
    followUps: [],
    completed: false,
  },
  sidebarCollapsed: false,
})

export function loadState(): PersistedState {
  const fallback = defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return fallback
    const value = parsed as Partial<PersistedState>
    return {
      ...fallback,
      websites: Array.isArray(value.websites) ? value.websites.map(sanitizeWebsite).filter((item): item is Website => item !== null).slice(0, 20) : [],
      selectedId: value.selectedId === 'demo' || typeof value.selectedId === 'string' ? value.selectedId : null,
      mode: value.mode === 'advanced' ? 'advanced' : 'beginner',
      profile: sanitizeProfile(value.profile),
      notifications: {
        email: Boolean(value.notifications?.email),
        sms: Boolean(value.notifications?.sms),
        whatsapp: Boolean(value.notifications?.whatsapp),
      },
      monitoringPrefs: sanitizePrefs(value.monitoringPrefs),
      issueStates: sanitizeIssueStates(value.issueStates),
      demoSandbox: sanitizeSandbox(value.demoSandbox),
      tutorial: sanitizeTutorial(value.tutorial),
      sidebarCollapsed: Boolean(value.sidebarCollapsed),
    }
  } catch {
    return fallback
  }
}

export function saveState(state: PersistedState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function sanitizeWebsite(value: unknown): Website | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<Website>
  if (typeof item.id !== 'string' || typeof item.url !== 'string' || typeof item.name !== 'string') return null
  if (item.id === 'demo' || item.isDemo) return null
  if (validatePublicUrlShape(item.url)) return null
  return {
    id: item.id.slice(0, 80),
    name: item.name.trim().slice(0, 80) || websiteName(item.url),
    url: item.url.trim(),
    isDemo: false,
    addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
    features: sanitizeFeatures(item.features),
    pages: arrayOf(item.pages).map(sanitizePage).filter((page): page is SavedPage => page !== null).slice(0, 30),
    forms: arrayOf(item.forms).map(sanitizeForm).filter((form): form is SavedForm => form !== null).slice(0, 20),
    checkout: sanitizeCheckout(item.checkout),
    reachability: sanitizeReachability(item.reachability),
  }
}

function sanitizeFeatures(value: FeatureFlags | undefined): FeatureFlags {
  return {
    uptime: value?.uptime !== false,
    brokenLinks: value?.brokenLinks !== false,
    pages: value?.pages !== false,
    forms: value?.forms !== false,
    checkout: value?.checkout !== false,
  }
}

function sanitizePage(value: unknown): SavedPage | null {
  if (!value || typeof value !== 'object') return null
  const page = value as Partial<SavedPage>
  if (typeof page.id !== 'string' || typeof page.name !== 'string' || typeof page.path !== 'string') return null
  if (!page.path.startsWith('/') || page.path.includes('..')) return null
  return {
    id: page.id.slice(0, 80),
    name: page.name.slice(0, 80),
    path: page.path.slice(0, 200),
    frequency: isFrequency(page.frequency) ? page.frequency : '15m',
  }
}

function sanitizeForm(value: unknown): SavedForm | null {
  if (!value || typeof value !== 'object') return null
  const form = value as Partial<SavedForm>
  if (typeof form.id !== 'string' || typeof form.name !== 'string' || typeof form.url !== 'string') return null
  if (validatePublicUrlShape(form.url)) return null
  return {
    id: form.id.slice(0, 80),
    name: form.name.slice(0, 80),
    url: form.url,
    expectedConfirmation: typeof form.expectedConfirmation === 'string' ? form.expectedConfirmation.slice(0, 180) : '',
    notes: typeof form.notes === 'string' ? form.notes.slice(0, 240) : '',
  }
}

function sanitizeCheckout(value: CheckoutSetup | undefined): CheckoutSetup {
  const fallback = defaultCheckout()
  if (!value) return fallback
  const steps = Array.isArray(value.steps) ? value.steps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0).slice(0, 6) : fallback.steps
  return {
    environmentUrl: typeof value.environmentUrl === 'string' ? value.environmentUrl.slice(0, 300) : '',
    testAccountLabel: typeof value.testAccountLabel === 'string' ? value.testAccountLabel.slice(0, 80) : '',
    steps: steps.length > 0 ? steps.map((step) => step.slice(0, 80)) : fallback.steps,
  }
}

function sanitizeReachability(value: Reachability | null | undefined): Reachability | null {
  if (!value || typeof value !== 'object') return null
  if (typeof value.checkedAt !== 'string' || typeof value.message !== 'string') return null
  return {
    checkedAt: value.checkedAt,
    ok: Boolean(value.ok),
    httpStatus: typeof value.httpStatus === 'number' ? value.httpStatus : null,
    responseTimeMs: typeof value.responseTimeMs === 'number' ? value.responseTimeMs : null,
    finalUrl: typeof value.finalUrl === 'string' ? value.finalUrl.slice(0, 300) : '',
    message: value.message.slice(0, 300),
  }
}

function sanitizeProfile(value: Profile | undefined): Profile {
  return {
    name: typeof value?.name === 'string' ? value.name.slice(0, 80) : '',
    email: typeof value?.email === 'string' ? value.email.slice(0, 120) : '',
  }
}

function sanitizePrefs(value: MonitoringPrefs | undefined): MonitoringPrefs {
  return {
    defaultFrequency: isFrequency(value?.defaultFrequency) ? value.defaultFrequency : '15m',
    alertOnWarning: value?.alertOnWarning !== false,
    alertOnCritical: value?.alertOnCritical !== false,
  }
}

function sanitizeIssueStates(value: Record<string, IssueStatus> | undefined) {
  if (!value || typeof value !== 'object') return {}
  const next: Record<string, IssueStatus> = {}
  for (const [key, status] of Object.entries(value)) {
    if (status === 'active' || status === 'reviewed' || status === 'resolved') next[key.slice(0, 80)] = status
  }
  return next
}

function sanitizeSandbox(value: DemoSandbox | undefined): DemoSandbox {
  const fallback = defaultState().demoSandbox
  if (!value) return fallback
  return {
    hiddenPageIds: stringList(value.hiddenPageIds),
    extraPages: arrayOf(value.extraPages).map(sanitizePage).filter((page): page is SavedPage => page !== null).slice(0, 20),
    pageFrequency: sanitizeFrequencyMap(value.pageFrequency),
    extraForms: arrayOf(value.extraForms).map(sanitizeForm).filter((form): form is SavedForm => form !== null).slice(0, 20),
    removedFormIds: stringList(value.removedFormIds),
    checkout: sanitizeCheckout(value.checkout),
  }
}

function sanitizeTutorial(value: TutorialState | undefined): TutorialState {
  const fallback = defaultState().tutorial
  if (!value) return fallback
  return {
    step: typeof value.step === 'number' && value.step >= 0 && value.step <= 9 ? Math.floor(value.step) : 0,
    selectedPages: stringList(value.selectedPages),
    inspectedLink: Boolean(value.inspectedLink),
    revealedCheckout: Boolean(value.revealedCheckout),
    followUps: Array.isArray(value.followUps)
      ? value.followUps.flatMap((item) => {
          if (!item || typeof item.question !== 'string' || typeof item.answer !== 'string') return []
          return [{ question: item.question.slice(0, 300), answer: item.answer.slice(0, 800) }]
        }).slice(0, 8)
      : [],
    completed: Boolean(value.completed),
  }
}

function sanitizeFrequencyMap(value: Record<string, Frequency> | undefined) {
  if (!value || typeof value !== 'object') return {}
  const next: Record<string, Frequency> = {}
  for (const [key, frequency] of Object.entries(value)) {
    if (isFrequency(frequency)) next[key.slice(0, 80)] = frequency
  }
  return next
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').slice(0, 40).map((item) => item.slice(0, 80))
}

function arrayOf(value: unknown) {
  return Array.isArray(value) ? value : []
}

function isFrequency(value: unknown): value is Frequency {
  return typeof value === 'string' && (FREQUENCY_OPTIONS as string[]).includes(value)
}

function websiteName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Website'
  }
}
