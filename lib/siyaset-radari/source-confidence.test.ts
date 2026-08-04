import { describe, expect, it } from 'vitest'
import { confidenceForUrl } from './source-confidence'

describe('confidenceForUrl', () => {
  it('classifies official and civil society sources', () => {
    expect(confidenceForUrl('https://www.tbmm.gov.tr/sandalyedagilimi')).toBe('official')
    expect(confidenceForUrl('https://tgs.org.tr/cezaevindeki-gazeteciler/')).toBe('high')
    expect(confidenceForUrl('https://example.com/haber')).toBe('standard')
    expect(confidenceForUrl('not-a-url')).toBe('low')
  })
})
