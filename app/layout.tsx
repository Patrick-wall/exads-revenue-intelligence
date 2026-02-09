import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'EXADS Revenue Intelligence',
  description: 'Proactive client monitoring & automated reporting',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
