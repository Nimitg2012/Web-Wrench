import { LoaderCircle, Send, Sparkles } from '../components/ui/icons.tsx'
import { useState } from 'react'
import { useApp } from '../context/context.ts'
import { Button } from '../components/ui/Button.tsx'
import { controlClass } from '../components/ui/Overlay.tsx'
import { DemoTag } from '../components/ui/Status.tsx'
import { cx } from '../utils/cx.ts'

const PROMPTS = [
  'Explain my website health.',
  'Why is my contact form failing?',
  'What does this uptime report mean?',
  'Which issue should I investigate first?',
  'Explain this error in simple English.',
]

export function Assistant() {
  const { selected, issues, messages, chatLoading, sendAssistantMessage, clearChat } = useApp()
  const [text, setText] = useState('')
  const [issueId, setIssueId] = useState('')
  const issue = issues.find((item) => item.id === issueId) ?? null
  const demo = Boolean(selected?.isDemo)

  const send = (value: string) => {
    const next = value.trim()
    if (!next) return
    setText('')
    void sendAssistantMessage(next, issue)
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-0 flex-col gap-4 sm:min-h-[32rem]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI assistant</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            {demo
              ? 'Demo replies explain the fictional store only. They are scripted for the tutorial and are not a live model.'
              : selected
                ? 'This chat can use a configured AI service. It does not have live monitoring results for your website.'
                : 'No website is selected. The assistant will not invent monitoring results.'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat}>Clear chat</Button>
      </div>
      {demo ? <DemoTag /> : null}
      <label className="text-sm text-muted">
        Issue context
        <select className={`${controlClass} mt-1`} value={issueId} onChange={(event) => setIssueId(event.target.value)}>
          <option value="">{issues.length === 0 ? 'No monitored issues' : 'No specific issue'}</option>
          {issues.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </select>
      </label>
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-panel">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {PROMPTS.map((prompt) => (
                <button key={prompt} type="button" className="rounded-xl border border-line bg-midnight px-3 py-3 text-left text-sm hover:border-purple/40" onClick={() => send(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={cx('max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 break-words', message.role === 'user' ? 'ml-auto bg-cyan/15 text-ink' : message.role === 'error' ? 'border border-danger/40 bg-danger/10 text-danger' : 'bg-midnight text-ink')}>
                {message.role === 'assistant' ? (
                  <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple">
                    <Sparkles className="h-3 w-3" />
                    {message.demo ? 'Demo reply' : 'Assistant'}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === 'error' ? (
                  <button type="button" className="mt-2 text-xs font-semibold text-ink" onClick={() => send(messages.filter((item) => item.role === 'user').at(-1)?.content ?? '')}>
                    Retry
                  </button>
                ) : null}
              </div>
            ))
          )}
          {chatLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {demo ? 'Preparing the tutorial reply…' : 'Contacting the AI service…'}
            </p>
          ) : null}
        </div>
        <form
          className="flex min-w-0 gap-2 border-t border-line p-3"
          onSubmit={(event) => {
            event.preventDefault()
            send(text)
          }}
        >
          <input className={`${controlClass} min-w-0 flex-1`} value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask about the selected website" />
          <Button type="submit" variant="ai" disabled={chatLoading || !text.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
