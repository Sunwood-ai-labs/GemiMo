'use client'
import { CameraFeed } from '@/components/debug/CameraFeed'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-800 text-white">
      <h1 className="text-3xl font-bold mb-8">GemiMo - Sleep Monitor</h1>
      <div className="max-w-4xl mx-auto">
        <CameraFeed />
      </div>
    </main>
  )
}
