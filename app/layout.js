import './globals.css'

export const metadata = {
  title: 'EXADS Sales Intelligence',
  description: 'Proactive client monitoring & automated reporting',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
