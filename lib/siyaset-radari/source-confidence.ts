import type { SourceConfidence } from './types'

const OFFICIAL_HOSTS = ['tbmm.gov.tr', 'ysk.gov.tr', 'acikveri.ysk.gov.tr', 'data.ysk.gov.tr']
const HIGH_CONFIDENCE_HOSTS = ['tgs.org.tr', 'cpj.org', 'mlsaturkey.com', 'bianet.org']

export function confidenceForUrl(url: string): SourceConfidence {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (OFFICIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return 'official'
    }
    if (HIGH_CONFIDENCE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return 'high'
    }
    return 'standard'
  } catch {
    return 'low'
  }
}
