import './globals.css'
import type { Metadata } from 'next'
import { Poppins, Playfair_Display } from 'next/font/google'
import { Navbar } from '@/components/ui/Navbar'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
})

export const metadata: Metadata = {
  title: 'GemiMo - Smart 3D Sleep Recognition',
  description: 'Your AI Sleep Guardian',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10">
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
