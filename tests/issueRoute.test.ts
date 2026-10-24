import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { matchPath } from 'react-router'
import { issueIdFor } from '../server/engine.ts'
import { findIssueByRoute } from '../src/utils/issueLookup.ts'

const fingerprint = 'link:site-a5d2ce1d-2d05-454e-b291-e63daf408d50:https://nimitgenerates.org/$%7BescapeHtml(project.href)%7D'

describe('issue routes', () => {
  it('opens a slash-containing issue id on the splat route', () => {
    const single = matchPath('/issues/:issueId', `/issues/${fingerprint}`)
    const splat = matchPath('/issues/*', `/issues/${fingerprint}`)
    assert.equal(single, null)
    assert.equal(splat?.params['*'], fingerprint)
  })

  it('opens the stored issue from either the safe id or the original fingerprint', () => {
    const issue = { id: issueIdFor(fingerprint), fingerprint, title: 'Broken link' }
    assert.equal(findIssueByRoute([issue], issue.id)?.title, 'Broken link')
    assert.equal(findIssueByRoute([issue], fingerprint)?.title, 'Broken link')
    assert.equal(findIssueByRoute([issue], decodeURIComponent(fingerprint))?.title, 'Broken link')
    assert.equal(findIssueByRoute([issue], 'missing-issue'), null)
    assert.equal(findIssueByRoute([issue], ''), null)
  })
})
