'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AlarmSettings } from '@/components/alarm/AlarmSettings'
import { SleepState } from '@/lib/types'

export default function Home() {
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [currentSettings, setCurrentSettings] = useState<{
    time: string;
    sounds: Record<SleepState, string>;
  } | null>(null)

  const handleAlarmSubmit = (settings: {
    time: string;
    sounds: Record<SleepState, string>;
  }) => {
    setAlarmEnabled(!alarmEnabled)
    setCurrentSettings(settings)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-display text-gray-800 mb-4">
          GemiMo
        </h1>
        <p className="text-xl font-display text-gray-600">
        AI Sleep Guardian
        </p>
      </header>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <AlarmSettings
          onSubmit={handleAlarmSubmit}
          enabled={alarmEnabled}
        />

        {/* Status Display */}
        {alarmEnabled && currentSettings && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-center text-gray-700">
              Alarm set for: {currentSettings.time}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link 
          href="/debug" 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Open Debug Panel
        </Link>
      </div>
    </div>
  )
}
