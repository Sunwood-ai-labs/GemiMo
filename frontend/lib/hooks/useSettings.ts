import { useState, useEffect } from 'react'

interface Settings {
  apiKey: string
  model: string
  cameraId: string
  facingMode: 'user' | 'environment'
  resolution: {
    width: number
    height: number
    label: string
  }
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    model: 'gemini-2.0-flash',
    cameraId: '',
    facingMode: 'environment',
    resolution: {
      width: 1280,
      height: 720,
      label: 'HD (1280x720)'
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSettings = async (newSettings: Partial<Settings>) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSettings(prev => ({ ...prev, ...newSettings }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (!response.ok) {
          throw new Error('Failed to load settings')
        }
        const data = await response.json()
        setSettings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      }
    }
    loadSettings()
  }, [])

  return {
    settings,
    isSaving,
    error,
    saveSettings
  }
}
