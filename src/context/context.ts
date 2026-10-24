import { createContext, useContext } from 'react'
import type { PersistedState } from '../services/storage.ts'
import type {
  ChatMessage,
  CheckoutSetup,
  ExperienceMode,
  ExplainRequest,
  Frequency,
  Issue,
  IssueStatus,
  Profile,
  SavedForm,
  SavedPage,
  ToastItem,
  TutorialState,
  Website,
} from '../types/index.ts'

export interface AppValue {
  state: PersistedState
  mode: ExperienceMode
  setMode: (mode: ExperienceMode) => void
  profile: Profile
  updateProfile: (profile: Profile) => void
  websites: Website[]
  options: Website[]
  selected: Website | null
  selectWebsite: (id: string | null) => void
  addWebsite: (website: Website) => boolean
  updateWebsite: (id: string, patch: Partial<Website>) => void
  removeWebsite: (id: string) => void
  setPaused: (id: string, paused: boolean) => void
  issues: Issue[]
  issueCatalog: Issue[]
  setIssueStatus: (id: string, status: IssueStatus) => void
  addPage: (page: SavedPage) => void
  removePage: (id: string) => void
  setPageFrequency: (id: string, frequency: Frequency) => void
  addForm: (form: SavedForm) => void
  removeForm: (id: string) => void
  saveCheckout: (checkout: CheckoutSetup) => void
  updateNotifications: (patch: Partial<PersistedState['notifications']>) => void
  updateMonitoringPrefs: (patch: Partial<PersistedState['monitoringPrefs']>) => void
  toggleSidebar: () => void
  tutorial: TutorialState
  patchTutorial: (patch: Partial<TutorialState>) => void
  resetTutorial: () => void
  explain: ExplainRequest | null
  openExplain: (request: ExplainRequest) => void
  closeExplain: () => void
  messages: ChatMessage[]
  chatLoading: boolean
  sendAssistantMessage: (text: string, issue: Issue | null) => Promise<void>
  clearChat: () => void
  toasts: ToastItem[]
  toast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: string) => void
}

export const AppContext = createContext<AppValue | null>(null)

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used within AppProvider')
  return value
}
