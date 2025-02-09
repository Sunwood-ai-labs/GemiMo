'use client'
import { CameraFeed } from '@/components/debug/CameraFeed'

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">GemiMo Debug</h1>
        <p className="text-gray-600">AI Sleep Recognition Debug Panel</p>
      </header>
      
      <div className="space-y-8">
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Camera Feed</h2>
          <CameraFeed />
        </section>
      </div>
    </div>
  )
}
