import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#C8102E" strokeWidth="4" />
        <path
          d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2 Z"
          fill="#C8102E"
        />
        <circle cx="50" cy="26" r="8" fill="#FFFFFF" />
        <circle cx="50" cy="74" r="8" fill="#C8102E" />
      </svg>
    ),
    size
  )
}
