'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navbar = () => {
  const pathname = usePathname()

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 fixed w-full z-50">
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
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/debug'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Debug
            </Link>
            <Link
              href="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/settings'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
