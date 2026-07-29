import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ImportanceToggle } from '@/components/survey/ImportanceToggle'
import { NoOpinionButton } from '@/components/survey/NoOpinionButton'
import { CoverageBadge } from '@/components/results/CoverageBadge'
import { MatchReasons } from '@/components/results/MatchReasons'

/**
 * Metodolojinin arayüzde görünen tarafını doğrular. Bu bileşenler kanca
 * kullanmadığı için sunucu tarafında string'e render edilebilirler.
 */

describe('önem işareti', () => {
  it('işaretsizken kapalı, işaretliyken açık bildirilir', () => {
    const off = renderToStaticMarkup(<ImportanceToggle checked={false} onChange={() => {}} />)
    const on = renderToStaticMarkup(<ImportanceToggle checked onChange={() => {}} />)

    expect(off).toContain('aria-checked="false"')
    expect(on).toContain('aria-checked="true"')
    expect(off).toContain('role="switch"')
  })

  it('ne yaptığını kullanıcıya açıklar', () => {
    const markup = renderToStaticMarkup(<ImportanceToggle checked={false} onChange={() => {}} />)

    expect(markup).toContain('önemli')
    expect(markup).toContain('daha ağır tartılır')
  })
})

describe('fikrim yok butonu', () => {
  it('ölçekten ayrı, basılı durumu bildiren bir kontrol olarak render edilir', () => {
    const markup = renderToStaticMarkup(
      <NoOpinionButton text="Fikrim yok" selected onSelect={() => {}} />
    )

    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('Fikrim yok')
  })
})

describe('kapsama rozeti', () => {
  it.each([
    ['high', 'yüksek'],
    ['medium', 'orta'],
    ['low', 'düşük'],
    ['none', 'yanıt yok'],
  ] as const)('%s -> "%s"', (tier, label) => {
    const markup = renderToStaticMarkup(<CoverageBadge tier={tier} answered={2} total={3} />)

    expect(markup).toContain(label)
    expect(markup).toContain('2/3 madde yanıtlandı')
  })
})

describe('neden bu sonuç kartı', () => {
  const comparison = (axisId: string, axisName: string, userScore: number, partyScore: number, weight = 1) => ({
    axisId,
    axisName,
    userScore,
    partyScore,
    impact: weight * Math.abs(userScore - partyScore),
    weight,
  })

  it('uyum ve ayrışma listelerini eksen adlarıyla gösterir', () => {
    const markup = renderToStaticMarkup(
      <MatchReasons
        party={{
          partyName: 'Test Partisi',
          agreements: [comparison('a', 'Ekonomik Model', 80, 78)],
          disagreements: [comparison('b', 'Göç Politikası', 90, -60)],
        }}
      />
    )

    expect(markup).toContain('Ekonomik Model')
    expect(markup).toContain('Göç Politikası')
    expect(markup).toContain('Test Partisi')
  })

  it('önem işaretli ekseni ayrıca belirtir', () => {
    const markup = renderToStaticMarkup(
      <MatchReasons
        party={{
          partyName: 'Test Partisi',
          agreements: [comparison('a', 'Ekonomik Model', 80, 78, 1.5)],
          disagreements: [],
        }}
      />
    )

    expect(markup).toContain('sizin için önemli')
  })

  it('boş listede o bölüm hiç çizilmez', () => {
    const markup = renderToStaticMarkup(
      <MatchReasons party={{ partyName: 'Test Partisi', agreements: [], disagreements: [] }} />
    )

    expect(markup).not.toContain('En çok örtüşen konular')
    expect(markup).not.toContain('En çok ayrışan konular')
  })
})
