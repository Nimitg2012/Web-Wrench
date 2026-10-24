export type ExperienceMode = 'beginner' | 'advanced'

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

export type MonitorState = 'operational' | 'degraded' | 'down' | 'unknown' | 'paused'

export type Frequency = '1m' | '5m' | '15m' | '1h' | '6h' | '24h'

export type Severity = 'warning' | 'critical'

export type IssueStatus = 'active' | 'reviewed' | 'resolved'

export type IssueCategory = 'uptime' | 'link' | 'page' | 'form' | 'checkout'

export interface FeatureFlags {
  uptime: boolean
  brokenLinks: boolean
  pages: boolean
  forms: boolean
  checkout: boolean
}

export interface SavedPage {
  id: string
  name: string
  path: string
  frequency: Frequency
  status?: HealthStatus
  detail?: string
  lastChecked?: string | null
}

export interface SavedForm {
  id: string
  name: string
  url: string
  expectedConfirmation: string
  notes: string
}

export interface CheckoutSetup {
  environmentUrl: string
  testAccountLabel: string
  steps: string[]
}

export interface Reachability {
  checkedAt: string
  ok: boolean
  httpStatus: number | null
  responseTimeMs: number | null
  finalUrl: string
  message: string
}

export interface Website {
  id: string
  name: string
  url: string
  isDemo: boolean
  addedAt: string
  features: FeatureFlags
  pages: SavedPage[]
  forms: SavedForm[]
  checkout: CheckoutSetup
  reachability: Reachability | null
  paused?: boolean
  frequency?: Frequency
  monitorState?: MonitorState
  checkCount?: number
  uptimePercent?: number | null
  series?: UptimePoint[]
  incidents?: Incident[]
  links?: LinkCheck[]
  activity?: ActivityItem[]
}

export interface TechnicalDetail {
  label: string
  value: string
}

export interface Explanation {
  whatHappened: string
  why: string[]
  seriousness: string
  nextSteps: string[]
  technical: string[]
}

export interface Issue {
  id: string
  websiteId: string
  title: string
  pageName: string
  pagePath: string
  severity: Severity
  status: IssueStatus
  category: IssueCategory
  detectedAt: string
  lastSeenAt?: string
  fingerprint?: string
  description: string
  whatHappened: string
  currentStatus: string
  investigation: string[]
  observed: string
  expected: string
  monitoringResult: string
  technical: TechnicalDetail[]
  isDemo: boolean
  explanation: Explanation
}

export interface ActivityItem {
  id: string
  pageName: string
  description: string
  status: HealthStatus
  timestamp: string
  href: string
}

export interface UptimePoint {
  label: string
  responseMs: number | null
  up: boolean
}

export interface TimelineEvent {
  time: string
  title: string
  detail: string
  tone: HealthStatus
}

export interface Incident {
  id: string
  title: string
  startedAt: string
  recoveredAt: string | null
  duration: string
  status: 'ongoing' | 'resolved'
  summary: string
  events: TimelineEvent[]
}

export interface LinkCheck {
  id: string
  source: string
  destination: string
  status: 'broken' | 'ok' | 'redirect' | 'unverified'
  httpStatus: number | null
  lastChecked: string
  description: string
  issueId?: string
}

export interface PageSnapshot {
  id: string
  name: string
  path: string
  frequency: Frequency
  status: HealthStatus
  detail: string
  lastChecked: string | null
  simulated: boolean
}

export interface FormSnapshot {
  id: string
  name: string
  url: string
  expectedConfirmation: string
  notes: string
  status: HealthStatus
  lastTest: string | null
  result: string
  observed: string[]
  possibleCauses: string[]
  simulated: boolean
}

export interface CheckoutStep {
  name: string
  state: 'passed' | 'failed' | 'not_reached'
  detail: string
}

export interface DemoSandbox {
  hiddenPageIds: string[]
  extraPages: SavedPage[]
  pageFrequency: Record<string, Frequency>
  extraForms: SavedForm[]
  removedFormIds: string[]
  checkout: CheckoutSetup
}

export interface TutorialState {
  step: number
  selectedPages: string[]
  inspectedLink: boolean
  revealedCheckout: boolean
  followUps: Array<{ question: string; answer: string }>
  completed: boolean
}

export interface Profile {
  name: string
  email: string
}

export interface NotificationPrefs {
  email: boolean
  sms: boolean
  whatsapp: boolean
}

export interface MonitoringPrefs {
  defaultFrequency: Frequency
  alertOnWarning: boolean
  alertOnCritical: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error' | 'note'
  content: string
  demo: boolean
}

export interface ExplainRequest {
  source: 'demo' | 'live'
  title: string
  monitoringResult: string
  expected: string
  observed: string
  technical: string
  severity: HealthStatus
  demoExplanation?: Explanation
}

export interface ToastItem {
  id: string
  message: string
  tone: 'success' | 'error' | 'info' | 'warning'
}
