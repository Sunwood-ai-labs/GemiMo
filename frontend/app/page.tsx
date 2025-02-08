'use client'
import { CameraFeed } from '@/components/debug/CameraFeed'

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      <header className="text-center mb-6">
        <h2 className="font-display text-2xl sm:text-4xl text-gray-800 mb-2">
          Smart Sleep Recognition
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Advanced AI-powered sleep monitoring system that watches over your peaceful rest
          using cutting-edge 3D recognition technology.
        </p>
      </header>
      
      <div className="grid gap-6">
        <div className="backdrop-blur-xl bg-white/80 rounded-lg p-4 sm:p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-800">Live Monitor</h3>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs sm:text-sm text-gray-600">Processing</span>
            </div>
          </div>
          <CameraFeed />
        </div>
      </div>
    </div>
  )
}
