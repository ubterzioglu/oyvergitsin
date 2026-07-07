import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

export const runtime = 'edge'
export const alt = `${siteConfig.name} sosyal paylasim gorseli`
export const size = {
  width: 1200,
  height: 630
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 55%, #38BDF8 100%)',
          color: '#FFFFFF',
          padding: '64px',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '36px',
            padding: '48px',
            background: 'rgba(15, 23, 42, 0.22)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              fontSize: 28,
              opacity: 0.9
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '18px',
                height: '18px',
                borderRadius: '999px',
                background: '#F97316'
              }}
            />
            Turkiye icin anonim siyasi eslesme platformu
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxWidth: '820px'
            }}
          >
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.04 }}>
              {siteConfig.name}
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.3, opacity: 0.92 }}>
              Siyasi gorusunuzu analiz edin ve size en yakin partileri dakikalar icinde gorun.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '18px',
              fontSize: 24
            }}
          >
            {['Anonim', 'Turkiye odakli', 'Hizli sonuclar'].map(label => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  padding: '14px 22px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)'
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  )
}
