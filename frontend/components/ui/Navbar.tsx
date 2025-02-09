'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navbar = () => {
  const pathname = usePathname()

  return (
    <nav className="fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-display font-semibold text-gray-800">GemiMo</span>
              <span className="text-sm text-gray-500 ml-2">AI Sleep Guardian</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              href="/debug" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/debug'
                  ? 'text-blue-600 bg-blue-50/50 backdrop-blur-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/30'
              }`}
            >
              Debug
            </Link>
            <Link
              href="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/settings'
                  ? 'text-blue-600 bg-blue-50/50 backdrop-blur-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/30'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
