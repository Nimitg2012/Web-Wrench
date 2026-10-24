import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppContext } from './context.ts'
import { DEMO_ISSUES, DEMO_WEBSITE, demoAssistantReply } from '../data/demoData.ts'
import { requestChat } from '../services/aiService.ts'
import { createMonitoredWebsite, deleteMonitoredWebsite, fetchMonitor, patchMonitoredWebsite, setMonitoringPaused, setStoredIssueStatus } from '../services/monitorApi.ts'
import { applyIssueStates } from '../services/monitoringService.ts'
import { defaultState, loadState, saveState, type PersistedState } from '../services/storage.ts'
import type {
  ChatMessage,
  CheckoutSetup,
  ExplainRequest,
  Frequency,
  Issue,
  IssueStatus,
  Profile,
  SavedForm,
  SavedPage,
  ToastItem,
  Website,
} from '../types/index.ts'
import { createId } from '../utils/cx.ts'
import { canonicalWebsiteUrl, normalizeWebsiteUrl } from '../utils/url.ts'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState())
  const [explain, setExplain] = useState<ExplainRequest | null>(null)
  const [serverIssues, setServerIssues] = useState<Issue[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    let stop = false
    let imported = false
    const pull = async () => {
      try {
        let feed = await fetchMonitor()
        if (!imported && feed.websites.length === 0) {
          imported = true
          const local = loadState().websites
          for (const website of local) {
            try {
              await createMonitoredWebsite(website)
            } catch {
              // A rejected address stays out of the server store.
            }
          }
          if (local.length > 0) feed = await fetchMonitor()
        } else {
          imported = true
        }
        if (stop) return
        setServerIssues(feed.issues)
        setState((current) => ({
          ...current,
          websites: feed.websites,
          selectedId:
            current.selectedId === 'demo' || feed.websites.some((website) => website.id === current.selectedId)
              ? current.selectedId
              : feed.websites[0]?.id ?? null,
        }))
      } catch {
        // Keep the last saved snapshot if the server is restarting.
      }
    }
    void pull()
    const timer = window.setInterval(() => void pull(), 15_000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [])

  const websites = state.websites
  const selected = useMemo(() => {
    if (state.selectedId === DEMO_WEBSITE.id) return DEMO_WEBSITE
    return websites.find((website) => website.id === state.selectedId) ?? null
  }, [state.selectedId, websites])

  const issueCatalog = useMemo(
    () => [...serverIssues, ...applyIssueStates(DEMO_ISSUES, state.issueStates)],
    [serverIssues, state.issueStates],
  )

  const issues = useMemo(() => {
    if (selected?.isDemo) return applyIssueStates(DEMO_ISSUES, state.issueStates)
    if (!selected) return []
    return serverIssues.filter((issue) => issue.websiteId === selected.id)
  }, [selected, serverIssues, state.issueStates])

  const toast = (message: string, tone: ToastItem['tone'] = 'info') => {
    const id = createId('toast')
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }

  const patch = (partial: Partial<PersistedState>) => setState((current) => ({ ...current, ...partial }))

  const updateWebsite = (id: string, websitePatch: Partial<Website>) => {
    setState((current) => ({
      ...current,
      websites: current.websites.map((website) => (website.id === id ? { ...website, ...websitePatch, isDemo: false } : website)),
    }))
    void patchMonitoredWebsite(id, websitePatch).catch((error: unknown) => {
      toast(error instanceof Error ? error.message : 'The website could not be updated.', 'error')
    })
  }

  const requireRealWebsite = () => {
    if (!selected || selected.isDemo) return null
    return selected
  }

  const sendAssistantMessage = async (text: string, issue: Issue | null) => {
    const trimmed = text.trim()
    if (!trimmed || chatLoading) return
    const demo = Boolean(selected?.isDemo)
    const userMessage: ChatMessage = { id: createId('msg'), role: 'user', content: trimmed, demo }
    const history = [...messages, userMessage]
    setMessages(history)
    setChatLoading(true)
    try {
      const reply = demo
        ? demoAssistantReply(trimmed, issue?.title)
        : await requestChat(history, liveContext(selected, issue, issues.filter((item) => item.status !== 'resolved').length), state.mode === 'beginner')
      setMessages((current) => [...current, { id: createId('msg'), role: 'assistant', content: reply, demo }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The assistant could not reply.'
      setMessages((current) => [...current, { id: createId('msg'), role: 'error', content: message, demo: false }])
    } finally {
      setChatLoading(false)
    }
  }

  const value: AppValue = {
    state,
    mode: state.mode,
    setMode: (mode) => patch({ mode }),
    profile: state.profile,
    updateProfile: (profile) => patch({ profile }),
    websites,
    options: [DEMO_WEBSITE, ...websites],
    selected,
    selectWebsite: (id) => patch({ selectedId: id }),
    addWebsite: (website) => {
      const normalized = normalizeWebsiteUrl(website.url)
      const key = canonicalWebsiteUrl(normalized)
      if (!key) return false
      let added = false
      setState((current) => {
        if (current.websites.some((item) => canonicalWebsiteUrl(item.url) === key)) return current
        added = true
        return {
          ...current,
          websites: [...current.websites, { ...website, url: normalized, frequency: website.frequency ?? current.monitoringPrefs.defaultFrequency, isDemo: false }],
          selectedId: website.id,
        }
      })
      if (added) {
        void createMonitoredWebsite({ ...website, url: normalized, frequency: website.frequency ?? state.monitoringPrefs.defaultFrequency, isDemo: false }).catch((error: unknown) => {
          toast(error instanceof Error ? error.message : 'The website could not be saved on the server.', 'error')
        })
      }
      return added
    },
    updateWebsite,
    removeWebsite: (id) => {
      setState((current) => ({
        ...current,
        websites: current.websites.filter((website) => website.id !== id),
        selectedId: current.selectedId === id ? null : current.selectedId,
      }))
      void deleteMonitoredWebsite(id).catch((error: unknown) => {
        toast(error instanceof Error ? error.message : 'The website could not be removed.', 'error')
      })
    },
    setPaused: (id, paused) => {
      setState((current) => ({
        ...current,
        websites: current.websites.map((website) => (website.id === id ? { ...website, paused, monitorState: paused ? 'paused' : website.monitorState === 'paused' ? 'unknown' : website.monitorState } : website)),
      }))
      void setMonitoringPaused(id, paused).catch((error: unknown) => {
        toast(error instanceof Error ? error.message : 'Monitoring could not be changed.', 'error')
      })
    },
    issues,
    issueCatalog,
    setIssueStatus: (id, status) => {
      if (DEMO_ISSUES.some((issue) => issue.id === id)) {
        setState((current) => ({ ...current, issueStates: { ...current.issueStates, [id]: status } }))
        return
      }
      setServerIssues((current) => current.map((issue) => (issue.id === id ? { ...issue, status } : issue)))
      void setStoredIssueStatus(id, status).catch((error: unknown) => {
        toast(error instanceof Error ? error.message : 'The issue status could not be saved.', 'error')
      })
    },
    addPage: (page) => {
      if (selected?.isDemo) {
        setState((current) => ({ ...current, demoSandbox: { ...current.demoSandbox, extraPages: [...current.demoSandbox.extraPages, page] } }))
        return
      }
      const website = requireRealWebsite()
      if (!website) return
      updateWebsite(website.id, { pages: [...website.pages, page] })
    },
    removePage: (id) => {
      if (selected?.isDemo) {
        setState((current) => ({
          ...current,
          demoSandbox: {
            ...current.demoSandbox,
            hiddenPageIds: current.demoSandbox.hiddenPageIds.includes(id) ? current.demoSandbox.hiddenPageIds : [...current.demoSandbox.hiddenPageIds, id],
            extraPages: current.demoSandbox.extraPages.filter((page) => page.id !== id),
          },
        }))
        return
      }
      const website = requireRealWebsite()
      if (!website) return
      updateWebsite(website.id, { pages: website.pages.filter((page) => page.id !== id) })
    },
    setPageFrequency: (id, frequency) => {
      if (selected?.isDemo) {
        setState((current) => ({
          ...current,
          demoSandbox: {
            ...current.demoSandbox,
            pageFrequency: { ...current.demoSandbox.pageFrequency, [id]: frequency },
            extraPages: current.demoSandbox.extraPages.map((page) => (page.id === id ? { ...page, frequency } : page)),
          },
        }))
        return
      }
      const website = requireRealWebsite()
      if (!website) return
      updateWebsite(website.id, { pages: website.pages.map((page) => (page.id === id ? { ...page, frequency } : page)) })
    },
    addForm: (form) => {
      if (selected?.isDemo) {
        setState((current) => ({ ...current, demoSandbox: { ...current.demoSandbox, extraForms: [...current.demoSandbox.extraForms, form] } }))
        return
      }
      const website = requireRealWebsite()
      if (!website) return
      updateWebsite(website.id, { forms: [...website.forms, form] })
    },
    removeForm: (id) => {
      if (selected?.isDemo) {
        setState((current) => ({
          ...current,
          demoSandbox: {
            ...current.demoSandbox,
            removedFormIds: [...current.demoSandbox.removedFormIds, id],
            extraForms: current.demoSandbox.extraForms.filter((form) => form.id !== id),
          },
        }))
        return
      }
      const website = requireRealWebsite()
      if (!website) return
      updateWebsite(website.id, { forms: website.forms.filter((form) => form.id !== id) })
    },
    saveCheckout: (checkout) => {
      if (selected?.isDemo) {
        setState((current) => ({ ...current, demoSandbox: { ...current.demoSandbox, checkout } }))
        return
      }
      const website = requireRealWebsite()
      if (!website) return
      updateWebsite(website.id, { checkout })
    },
    updateNotifications: (notifications) => setState((current) => ({ ...current, notifications: { ...current.notifications, ...notifications } })),
    updateMonitoringPrefs: (prefs) => setState((current) => ({ ...current, monitoringPrefs: { ...current.monitoringPrefs, ...prefs } })),
    toggleSidebar: () => setState((current) => ({ ...current, sidebarCollapsed: !current.sidebarCollapsed })),
    tutorial: state.tutorial,
    patchTutorial: (tutorialPatch) => setState((current) => ({ ...current, tutorial: { ...current.tutorial, ...tutorialPatch } })),
    resetTutorial: () => patch({ tutorial: defaultState().tutorial }),
    explain,
    openExplain: setExplain,
    closeExplain: () => setExplain(null),
    messages,
    chatLoading,
    sendAssistantMessage,
    clearChat: () => setMessages([]),
    toasts,
    toast,
    dismissToast: (id) => setToasts((current) => current.filter((item) => item.id !== id)),
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(100%-2rem,22rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-left text-sm shadow-card ${
              item.tone === 'success'
                ? 'border-teal/30 bg-panel text-teal'
                : item.tone === 'error'
                  ? 'border-danger/40 bg-panel text-danger'
                  : item.tone === 'warning'
                    ? 'border-warn/40 bg-panel text-warn'
                    : 'border-line bg-panel text-ink'
            }`}
          >
            {item.message}
          </button>
        ))}
      </div>
    </AppContext.Provider>
  )
}

function liveContext(website: Website | null, issue: Issue | null, openCount: number) {
  const lines = [
    website
      ? `Selected website: ${website.name} (${website.url}). Uptime monitoring is running. State: ${website.monitorState ?? 'unknown'}. Paused: ${website.paused ? 'yes' : 'no'}. Interval: ${website.frequency ?? '1m'}.`
      : 'No website is selected. Do not invent monitoring results.',
  ]
  if (website?.reachability) {
    lines.push(`Latest stored check: ${website.reachability.message} HTTP ${website.reachability.httpStatus ?? 'none'} at ${website.reachability.checkedAt}.`)
  } else if (website) {
    lines.push('No stored check exists yet. Do not invent a status code or uptime percentage.')
  }
  if (website && (website.checkCount ?? 0) >= 2 && website.uptimePercent !== null && website.uptimePercent !== undefined) {
    lines.push(`Uptime from ${website.checkCount} stored checks: ${website.uptimePercent}%.`)
  } else if (website) {
    lines.push(`Stored uptime checks: ${website.checkCount ?? 0}. The percentage stays hidden until two checks exist. Monitoring is still on.`)
  }
  lines.push(`Open in-app alerts: ${openCount}. These are not emails.`)
  if (issue) lines.push(`Selected issue: ${issue.title}. ${issue.monitoringResult} Observed: ${issue.observed}`)
  lines.push(`Saved pages: ${website?.pages.length ?? 0}. Form tests and checkout automation are not running.`)
  return lines.join('\n')
}
