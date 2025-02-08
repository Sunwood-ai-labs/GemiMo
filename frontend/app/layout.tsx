import './globals.css'
import type { Metadata } from 'next'
import { Poppins, Playfair_Display } from 'next/font/google'
import Link from 'next/link'

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
        <div className="min-h-screen backdrop-blur-sm">
          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md bg-white/5">
            <div className="container mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-xl sm:text-2xl font-display text-gray-800">
                  GemiMo
                </Link>
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <Link 
                    href="/settings"
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Settings
                  </Link>
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs sm:text-sm text-gray-600">System Active</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="px-4 pt-16 sm:pt-20 pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
