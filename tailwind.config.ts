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
        // Turkish political party colors
        akp: '#F7941D',
        chp: '#E30A17',
        mhp: '#F2B705',
        iyy: '#0B1F3A',
        dem: '#7A3DB8',
        deva: '#2EAD4A',
        gelep: '#1B6FB3',
        saadet: '#6A1BB3',
        tip: '#333333',
        vatan: '#D10F2F',
        ysp: '#0F7A3A',
        zp: '#D61F26',
        dbp: '#F2C300',
        hdp: '#E31B23',
        zafer: '#00964C',
        memleket: '#FDD007',
      },
    },
  },
  plugins: [],
}
export default config
