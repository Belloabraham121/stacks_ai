import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stacks AI App',
  description: 'Stacks AI is a cutting-edge project focused on developing advanced artificial intelligence solutions for the Stacks ecosystem',
  generator: '',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
