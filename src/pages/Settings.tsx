import { useState } from 'react'
import { useApp } from '../context/context.ts'
import { Button, Card } from '../components/ui/Button.tsx'
import { controlClass, Field, Toggle } from '../components/ui/Overlay.tsx'
import { ComingSoon } from '../components/ui/Status.tsx'
import type { FeatureFlags } from '../types/index.ts'
import { cx } from '../utils/cx.ts'
import { FREQUENCY_LABEL, FREQUENCY_OPTIONS } from '../utils/format.ts'
import { isEmail } from '../utils/url.ts'

const SECTIONS = ['Account', 'Websites', 'Notifications', 'Monitoring', 'Integrations', 'Experience'] as const

export function Settings() {
  const app = useApp()
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('Account')
  const [name, setName] = useState(app.profile.name)
  const [email, setEmail] = useState(app.profile.email)
  const [error, setError] = useState('')

  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Settings sections">
        {SECTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSection(item)}
            className={cx('min-h-11 shrink-0 rounded-xl px-3 py-2 text-left text-sm lg:min-h-0', section === item ? 'bg-panel text-ink' : 'text-muted hover:bg-panel')}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="flex flex-col gap-4">
        {section === 'Account' ? (
          <Card className="space-y-4">
            <h1 className="text-xl font-semibold">Account settings</h1>
            <p className="text-sm text-muted">Saved on this device only. Web Wrench does not have an account server yet.</p>
            <Field label="Name">
              <input className={controlClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email" error={error} hint="Optional. It is not used to send mail.">
              <input className={controlClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (email.trim() && !isEmail(email.trim())) {
                    setError('Enter a valid email, or leave it blank.')
                    return
                  }
                  setError('')
                  app.updateProfile({ name: name.trim(), email: email.trim() })
                  app.toast('Account details saved on this device.', 'success')
                }}
              >
                Save account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setName(app.profile.name)
                  setEmail(app.profile.email)
                  setError('')
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : null}
        {section === 'Websites' ? (
          <Card className="space-y-4">
            <h1 className="text-xl font-semibold">Website settings</h1>
            <p className="text-sm text-muted">The demo store is separate and cannot be edited here. Preferences do not start live checks.</p>
            {app.websites.length === 0 ? <p className="text-sm text-muted">No saved websites yet.</p> : app.websites.map((website) => (
              <div key={website.id} className="rounded-xl border border-line p-4">
                <h2 className="font-medium">{website.name}</h2>
                <p className="text-xs text-muted">{website.url}</p>
                <div className="mt-3 grid gap-2">
                  {(Object.keys(website.features) as Array<keyof FeatureFlags>).map((feature) => (
                    <Toggle
                      key={feature}
                      checked={website.features[feature]}
                      label={feature}
                      description="Saved preference only."
                      onChange={(checked) => app.updateWebsite(website.id, { features: { ...website.features, [feature]: checked } })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        ) : null}
        {section === 'Notifications' ? (
          <Card className="space-y-3">
            <h1 className="text-xl font-semibold">Notification settings</h1>
            <p className="text-sm text-muted">Your choices are saved on this device. Messages are not sent.</p>
            <Toggle checked={app.state.notifications.email} label="Email" badge={<ComingSoon />} description="Delivery is not connected." onChange={(email) => app.updateNotifications({ email })} />
            <Toggle checked={app.state.notifications.sms} label="SMS" badge={<ComingSoon />} description="Delivery is not connected." onChange={(sms) => app.updateNotifications({ sms })} />
            <Toggle checked={app.state.notifications.whatsapp} label="WhatsApp" badge={<ComingSoon />} description="Delivery is not connected." onChange={(whatsapp) => app.updateNotifications({ whatsapp })} />
            <Button variant="secondary" disabled>Send a test message · Not available</Button>
          </Card>
        ) : null}
        {section === 'Monitoring' ? (
          <Card className="space-y-4">
            <h1 className="text-xl font-semibold">Monitoring preferences</h1>
            <Field label="Default frequency for newly saved pages" hint="This does not schedule a check.">
              <select
                className={controlClass}
                value={app.state.monitoringPrefs.defaultFrequency}
                onChange={(event) => app.updateMonitoringPrefs({ defaultFrequency: event.target.value as typeof app.state.monitoringPrefs.defaultFrequency })}
              >
                {FREQUENCY_OPTIONS.map((option) => <option key={option} value={option}>{FREQUENCY_LABEL[option]}</option>)}
              </select>
            </Field>
            <Toggle checked={app.state.monitoringPrefs.alertOnWarning} label="Remember warning alerts" description="No warning message will be sent." onChange={(alertOnWarning) => app.updateMonitoringPrefs({ alertOnWarning })} />
            <Toggle checked={app.state.monitoringPrefs.alertOnCritical} label="Remember critical alerts" description="No critical message will be sent." onChange={(alertOnCritical) => app.updateMonitoringPrefs({ alertOnCritical })} />
          </Card>
        ) : null}
        {section === 'Integrations' ? (
          <Card className="space-y-3">
            <h1 className="text-xl font-semibold">Integrations</h1>
            {['Slack', 'Email provider', 'Webhook'].map((name) => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted">Not connected.</p>
                </div>
                <ComingSoon />
              </div>
            ))}
            <Button variant="secondary" disabled>Connect · Not available</Button>
          </Card>
        ) : null}
        {section === 'Experience' ? (
          <Card className="space-y-3">
            <h1 className="text-xl font-semibold">Beginner and advanced mode</h1>
            <p className="text-sm text-muted">Beginner mode is the default. It hides status codes unless you ask for them.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => app.setMode('beginner')} className={cx('rounded-xl border p-4 text-left', app.mode === 'beginner' ? 'border-cyan/50 bg-cyan/10' : 'border-line')}>
                <span className="block font-medium">Beginner mode</span>
                <span className="mt-1 block text-sm text-muted">Simple explanations, fewer codes, clearer next steps.</span>
              </button>
              <button type="button" onClick={() => app.setMode('advanced')} className={cx('rounded-xl border p-4 text-left', app.mode === 'advanced' ? 'border-cyan/50 bg-cyan/10' : 'border-line')}>
                <span className="block font-medium">Advanced mode</span>
                <span className="mt-1 block text-sm text-muted">HTTP details, response notes, and setup fields.</span>
              </button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
