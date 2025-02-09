'use client'
import { CameraFeed } from '@/components/debug/CameraFeed'

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">GemiMo Debug</h1>
        <p className="text-gray-600">AI Sleep Recognition Debug Panel</p>
      </header>
      <CameraFeed />
    </div>
  )
}
