'use client'
import { CameraFeed } from '@/components/debug/CameraFeed'

export default function Home() {
  return (
    <div className="container mx-auto max-w-6xl">
      <header className="text-center mb-12">
        <h2 className="font-display text-4xl text-gray-800 mb-3">
          Smart Sleep Recognition
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Advanced AI-powered sleep monitoring system that watches over your peaceful rest
          using cutting-edge 3D recognition technology.
        </p>
      </header>
      
      <div className="grid gap-6">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">Live Monitor</h3>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm text-gray-600">Processing</span>
            </div>
          </div>
          <CameraFeed />
        </div>
      </div>
    </div>
  )
}
