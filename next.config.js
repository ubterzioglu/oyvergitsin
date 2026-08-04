/** @type {import('next').NextConfig} */

const path = require('path')

// Next.js gelistirme sunucusu HMR ve React Refresh icin eval kullanir. CSP
// 'unsafe-eval' izni vermedigi surece uygulama YEREL GELISTIRMEDE tarayicida
// hidrate olmaz: butonlar hicbir sey yapmaz. Uretimde eval kullanilmadigi icin
// bu izin yalnizca gelistirmede verilir.
const isDev = process.env.NODE_ENV !== 'production'

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev ? "'unsafe-eval'" : null,
]
  .filter(Boolean)
  .join(' ')

const noIndexHeaders = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
]

const noStoreHeaders = [
  ...noIndexHeaders,
  { key: 'Cache-Control', value: 'no-store, private' },
]

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: noStoreHeaders,
      },
      {
        source: '/results/:path*',
        headers: noStoreHeaders,
      },
      {
        source: '/admin/:path*',
        headers: noIndexHeaders,
      },
      {
        source: '/consent',
        headers: noIndexHeaders,
      },
      {
        source: '/survey',
        headers: noIndexHeaders,
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
