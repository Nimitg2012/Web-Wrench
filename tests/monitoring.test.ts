import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEMO_ISSUES } from '../src/data/demoData.ts'
import { activeIssueCount, applyIssueStates, demoHealth, filterIssues, openIssues, uptimeReport } from '../src/services/monitoringService.ts'
import { tutorialContinueBlock } from '../src/utils/tutorial.ts'
import { formatRelative } from '../src/utils/format.ts'
import type { Issue, Website } from '../src/types/index.ts'

const base = {
  step: 1,
  inspectedLink: false,
  selectedPages: [] as string[],
  revealedCheckout: false,
}

describe('monitoring calculations', () => {
  it('keeps demo health aligned with unresolved issues', () => {
    assert.equal(demoHealth(DEMO_ISSUES), 'critical')
    const resolved = applyIssueStates(DEMO_ISSUES, Object.fromEntries(DEMO_ISSUES.map((issue) => [issue.id, 'resolved' as const])))
    assert.equal(demoHealth(resolved), 'healthy')
    assert.equal(activeIssueCount(resolved), 0)
    assert.equal(openIssues(resolved).length, 0)
  })

  it('does not count a reviewed issue as active, but still treats it as open', () => {
    const reviewed = applyIssueStates(DEMO_ISSUES, { 'demo-checkout': 'reviewed' })
    assert.equal(activeIssueCount(reviewed), activeIssueCount(DEMO_ISSUES) - 1)
    assert.ok(openIssues(reviewed).some((issue) => issue.id === 'demo-checkout'))
    assert.equal(demoHealth(reviewed), 'critical')
  })

  it('filters and sorts issues without mixing statuses', () => {
    const active = filterIssues(DEMO_ISSUES, '', 'active', 'all', 'severity')
    assert.ok(active.every((issue) => issue.status === 'active'))
    assert.equal(active[0]?.severity, 'critical')
    const checkout = filterIssues(DEMO_ISSUES, 'checkout', 'all', 'critical', 'newest')
    assert.equal(checkout.length, 1)
    assert.equal(checkout[0]?.id, 'demo-checkout')
    assert.equal(filterIssues(DEMO_ISSUES, 'resolved-only-text', 'resolved', 'all', 'oldest').length, 0)
  })

  it('does not invent uptime for a saved website', () => {
    const website = {
      id: 'site',
      isDemo: false,
      reachability: null,
    } as Website
    const report = uptimeReport(website)
    assert.equal(report?.simulated, false)
    assert.equal(report?.uptimePercent, null)
    assert.equal(report?.status, 'unknown')
  })

  it('blocks tutorial progress until the required action happens', () => {
    assert.match(tutorialContinueBlock({ ...base, step: 3 }), /broken link/)
    assert.equal(tutorialContinueBlock({ ...base, step: 3, inspectedLink: true }), '')
    assert.match(tutorialContinueBlock({ ...base, step: 4 }), /at least one page/)
    assert.equal(tutorialContinueBlock({ ...base, step: 4, selectedPages: ['home'] }), '')
    assert.match(tutorialContinueBlock({ ...base, step: 6 }), /checkout/)
    assert.equal(tutorialContinueBlock({ ...base, step: 6, revealedCheckout: true }), '')
  })

  it('formats a recent timestamp', () => {
    const twoMinutes = new Date(Date.now() - 2 * 60_000).toISOString()
    assert.equal(formatRelative(twoMinutes), '2 minutes ago')
    assert.equal(formatRelative(null), 'Not checked')
  })

  it('does not treat demo issues as belonging to another website', () => {
    const foreign = DEMO_ISSUES.filter((issue: Issue) => issue.websiteId !== 'demo')
    assert.equal(foreign.length, 0)
    assert.ok(DEMO_ISSUES.every((issue) => issue.isDemo))
  })
})
