import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { absolutePageUrl, canonicalWebsiteUrl, isPrivateIpv4, normalizeWebsiteUrl, validatePagePath, validatePublicUrlShape, websiteScope } from '../src/utils/url.ts'

describe('website URLs', () => {
  it('adds https when the protocol is missing', () => {
    assert.equal(normalizeWebsiteUrl('example.com/pricing'), 'https://example.com/pricing')
    assert.equal(validatePublicUrlShape(normalizeWebsiteUrl('example.com')), null)
  })

  it('keeps an explicit http URL', () => {
    assert.equal(normalizeWebsiteUrl('http://example.com'), 'http://example.com')
  })

  it('rejects empty, unsupported, and credentialed URLs', () => {
    assert.match(validatePublicUrlShape(''), /Enter a website URL/)
    assert.match(validatePublicUrlShape('notaurl'), /https:\/\//)
    assert.match(validatePublicUrlShape('ftp://example.com'), /http and https/)
    assert.match(validatePublicUrlShape('https://user:pass@example.com'), /username/)
  })

  it('rejects local, private, metadata, and abbreviated addresses', () => {
    for (const url of [
      'http://localhost',
      'http://127.0.0.1',
      'http://127.1',
      'http://10.0.0.8',
      'http://192.168.1.20',
      'http://169.254.169.254',
      'http://[::1]',
      'http://metadata.google.internal',
      'http://2130706433',
    ]) {
      assert.ok(validatePublicUrlShape(url), url)
    }
  })

  it('allows a public address and treats www and a trailing slash as the same site', () => {
    assert.equal(validatePublicUrlShape('https://example.com'), null)
    assert.equal(canonicalWebsiteUrl('https://www.Example.com/about/'), canonicalWebsiteUrl('https://example.com/about'))
    assert.equal(isPrivateIpv4('1.1.1.1'), false)
    assert.equal(isPrivateIpv4('172.16.0.1'), true)
  })

  it('treats formatting differences as the same website and other hosts as external', () => {
    const registered = 'https://example.com'
    for (const target of [
      'https://example.com/about',
      'http://example.com/contact',
      'https://www.example.com/pricing/',
      'https://example.com/pricing?plan=1#cost',
      '/about',
    ]) {
      assert.equal(websiteScope(registered, target), 'internal', target)
    }
    assert.equal(websiteScope('https://example.com/', 'https://github.com/example/repo'), 'external')
    assert.equal(websiteScope('https://nimitgenerates.org', 'https://fonts.googleapis.com/css2?family=Inter'), 'external')
    assert.equal(websiteScope(registered, ''), 'unknown')
    assert.equal(absolutePageUrl('https://example.com', '/about'), 'https://example.com/about')
    assert.equal(absolutePageUrl('http://www.example.com/', 'https://example.com/pricing/'), 'https://example.com/pricing/')
  })

  it('validates page paths', () => {
    assert.equal(validatePagePath('/contact'), null)
    assert.match(validatePagePath('contact') ?? '', /starts with/)
    assert.match(validatePagePath('/../secret') ?? '', /simple path/)
  })
})
