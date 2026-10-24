import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertPublicUrl, isGuardError, isPrivateIp } from '../server/guard.ts'

describe('server URL guard', () => {
  it('blocks local and metadata targets before a request', async () => {
    for (const url of ['http://127.0.0.1/', 'http://127.1/', 'http://169.254.169.254/', 'http://localhost/latest', 'http://[::1]/']) {
      await assert.rejects(assertPublicUrl(url), (error: unknown) => {
        assert.equal(isGuardError(error), true)
        if (isGuardError(error)) assert.equal(error.code, 'BLOCKED')
        return true
      })
    }
  })

  it('recognizes private addresses', () => {
    assert.equal(isPrivateIp('10.1.2.3'), true)
    assert.equal(isPrivateIp('::1'), true)
    assert.equal(isPrivateIp('8.8.8.8'), false)
    assert.equal(isPrivateIp('169.254.169.254'), true)
  })
})