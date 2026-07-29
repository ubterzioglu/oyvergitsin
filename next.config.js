/** @type {import('next').NextConfig} */

// Next.js gelistirme sunucusu HMR ve React Refresh icin eval kullanir. CSP
// 'unsafe-eval' izni vermedigi surece uygulama YEREL GELISTIRMEDE tarayicida
// hidrate olmaz: butonlar hicbir sey yapmaz. Uretimde eval kullanilmadigi icin
// bu izin yalnizca gelistirmede verilir.
const isDev = process.env.NODE_ENV !== 'production'

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev ? "'unsafe-eval'" : null,
  // Clarity'nin yukleyici betigi www.clarity.ms'ten, asil betigi ise
  // scripts.clarity.ms'ten geliyor; alt alan adlarinin tamami gerekiyor.
  'https://*.clarity.ms',
]
  .filter(Boolean)
  .join(' ')

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
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
              "connect-src 'self' https://*.supabase.co https://*.clarity.ms",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
