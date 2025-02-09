import { useState, useEffect } from 'react'
import { SleepState } from '@/lib/types'

interface AlarmSettings {
  time: string
  sounds: Record<SleepState, string>
  enabled: boolean
}

export const useAlarmSettings = () => {
  const [settings, setSettings] = useState<AlarmSettings>({
    time: '07:00',
    sounds: {
      SLEEPING: '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3',
      STRUGGLING: '/sounds/struggling/Feline Symphony.mp3',
      AWAKE: '/sounds/awake/Silent Whisper of the Sakura.mp3',
      UNKNOWN: ''
    },
    enabled: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/alarm/settings')
      if (!response.ok) throw new Error('Failed to load settings')
      const data = await response.json()
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (newSettings: AlarmSettings) => {
    try {
      const response = await fetch('/api/alarm/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })
      if (!response.ok) throw new Error('Failed to save settings')
      setSettings(newSettings)
      setError(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    loadSettings
  }
}
