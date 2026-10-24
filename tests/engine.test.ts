import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyProbeIssue, extractLinks, issueIdFor, nextMonitorState, uptimePercent, type CheckRecord, type Probe } from '../server/engine.ts'

const probe = (patch: Partial<Probe>): Probe => ({
  ok: false,
  httpStatus: null,
  responseTimeMs: null,
  error: 'failed',
  confirmed: true,
  finalUrl: 'https://example.com',
  ...patch,
})

describe('monitoring engine', () => {
  it('does not call one failed check an outage', () => {
    assert.equal(nextMonitorState(0, probe({ confirmed: true })).state, 'degraded')
    assert.equal(nextMonitorState(1, probe({ confirmed: true })).state, 'down')
  })

  it('treats a slow success as degraded and a fast success as operational', () => {
    assert.equal(nextMonitorState(2, probe({ ok: true, httpStatus: 200, responseTimeMs: 4200, error: null })).state, 'degraded')
    const recovered = nextMonitorState(2, probe({ ok: true, httpStatus: 200, responseTimeMs: 180, error: null }))
    assert.equal(recovered.state, 'operational')
    assert.equal(recovered.failures, 0)
  })

  it('calculates uptime only after two stored checks', () => {
    const one: CheckRecord[] = [{ id: '1', websiteId: 's', kind: 'uptime', url: 'https://example.com', at: '2026-01-01T00:00:00.000Z', ok: true, httpStatus: 200, responseTimeMs: 10, error: null, confirmed: true }]
    assert.equal(uptimePercent(one), null)
    const two: CheckRecord[] = [...one, { ...one[0], id: '2', ok: false }]
    assert.equal(uptimePercent(two), 50)
  })

  it('resolves an issue when a later check is healthy', () => {
    const opened = applyProbeIssue([], {
      fingerprint: 'uptime:s',
      websiteId: 's',
      title: 'Website is down',
      pageName: 'Homepage',
      pagePath: '/',
      severity: 'critical',
      category: 'uptime',
      at: '2026-01-01T00:00:00.000Z',
      observed: 'HTTP 500',
      expected: 'The homepage responds successfully.',
      monitoringResult: 'Stored check failed.',
      technical: [],
      investigation: ['Look again.'],
      active: true,
    })
    assert.equal(opened[0]?.status, 'active')
    const resolved = applyProbeIssue(opened, {
      fingerprint: 'uptime:s',
      websiteId: 's',
      title: 'Website is down',
      pageName: 'Homepage',
      pagePath: '/',
      severity: 'critical',
      category: 'uptime',
      at: '2026-01-01T00:15:00.000Z',
      observed: 'HTTP 200',
      expected: 'The homepage responds successfully.',
      monitoringResult: 'Stored check succeeded.',
      technical: [],
      investigation: [],
      active: false,
    })
    assert.equal(resolved[0]?.status, 'resolved')
  })

  it('keeps link extraction inside the crawl limit and skips unsafe schemes', () => {
    const html = Array.from({ length: 20 }, (_, index) => `<a href="/page-${index}">x</a>`).join('') + '<a href="mailto:a@example.com">m</a><a href="javascript:alert(1)">j</a>'
    const links = extractLinks(html, 'https://example.com/')
    assert.equal(links.length, 12)
    assert.equal(links[0], 'https://example.com/page-0')
    assert.ok(links.every((link) => link.startsWith('https://example.com/page-')))
  })

  it('ignores template hrefs inside scripts and keeps real internal and external links', () => {
    const html = [
      '<a href="/about">About</a>',
      '<a href="https://github.com/example/repo">Code</a>',
      '<a href="https://example.com/pricing/">Pricing</a>',
      '<script>return `<a href="${escapeHtml(project.href)}">Visit</a><a href="${zip}">Download</a>`</script>',
      '<a href="${repo}">Repo</a>',
    ].join('')
    const links = extractLinks(html, 'https://www.example.com/')
    assert.deepEqual(links, [
      'https://www.example.com/about',
      'https://github.com/example/repo',
      'https://example.com/pricing/',
    ])
  })

  it('gives a link issue an id that can be a single route segment', () => {
    const fingerprint = 'link:site-a5d2ce1d-2d05-454e-b291-e63daf408d50:https://nimitgenerates.org/$%7BescapeHtml(project.href)%7D'
    const opened = applyProbeIssue([], {
      fingerprint,
      websiteId: 'site-a5d2ce1d-2d05-454e-b291-e63daf408d50',
      title: 'Broken link',
      pageName: 'Link',
      pagePath: 'https://nimitgenerates.org/$%7BescapeHtml(project.href)%7D',
      severity: 'warning',
      category: 'link',
      at: '2026-01-01T00:00:00.000Z',
      observed: 'HTTP 404',
      expected: 'The link opens.',
      monitoringResult: 'Confirmed broken link.',
      technical: [{ label: 'HTTP status', value: '404' }],
      investigation: ['Open the issue details.'],
      active: true,
    })
    assert.equal(opened[0]?.id, issueIdFor(fingerprint))
    assert.match(opened[0]?.id ?? '', /^issue-[a-f0-9]{20}$/)
    assert.equal(opened[0]?.fingerprint, fingerprint)
  })
})
