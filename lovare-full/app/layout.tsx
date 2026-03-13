import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lovare Diagnostic Engine',
  description: 'The first LSAT tool to distinguish anxiety-driven from knowledge-driven score gaps.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
