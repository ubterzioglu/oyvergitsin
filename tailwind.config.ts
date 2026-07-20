import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rainbow: {
          yellow: '#F5C518',
          'yellow-tint': '#FDF6DC',
          orange: '#F5821F',
          'orange-tint': '#FDEBDA',
          red: '#E8385C',
          'red-tint': '#FBDEE4',
          purple: '#7B4FE0',
          'purple-tint': '#EBE3FA',
          blue: '#1E9BE0',
          'blue-tint': '#DDF0FB',
          'blue-hover': '#1580BD',
          green: '#3CB043',
          'green-tint': '#DFF3E0',
        },
        surface: {
          DEFAULT: '#FAFBFC',
          card: '#FFFFFF',
          muted: '#F1F3F6',
        },
        ink: {
          primary: '#1A1D23',
          secondary: '#5A6270',
          muted: '#8B919A',
        },
        border: {
          DEFAULT: '#E2E5EA',
          strong: '#CBD0D7',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        card: '1rem',
        button: '0.625rem',
        badge: '0.375rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)',
        elevated: '0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
export default config
