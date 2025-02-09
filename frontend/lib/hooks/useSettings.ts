import { useState, useEffect } from 'react'
import { SleepState } from '../types'

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
  alarmSounds?: {
    [key in SleepState]?: string
  }
}

const DEFAULT_ALARM_SOUNDS = {
  SLEEPING: '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3',
  STRUGGLING: '/sounds/struggling/Feline Symphony.mp3',
  AWAKE: '/sounds/awake/Silent Whisper of the Sakura.mp3',
  UNKNOWN: ''
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
    },
    alarmSounds: DEFAULT_ALARM_SOUNDS
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSettings = async (newSettings: Partial<Settings>) => {
    setIsSaving(true)
    try {
      console.log('保存する設定:', newSettings)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error('設定の保存に失敗しました')
      }

      setSettings(prev => {
        const updated = { ...prev, ...newSettings }
        // アラーム音の設定がない場合はデフォルト値を使用
        if (!updated.alarmSounds) {
          updated.alarmSounds = DEFAULT_ALARM_SOUNDS
        }
        return updated
      })
      setError(null)
    } catch (err) {
      console.error('設定保存エラー:', err)
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('設定を読み込み中...')
        const response = await fetch('/api/settings')
        if (!response.ok) {
          throw new Error('設定の読み込みに失敗しました')
        }
        const data = await response.json()
        
        // アラーム音の設定がない場合はデフォルト値を使用
        if (!data.alarmSounds) {
          data.alarmSounds = DEFAULT_ALARM_SOUNDS
        }
        
        console.log('読み込んだ設定:', data)
        setSettings(data)
      } catch (err) {
        console.error('設定読み込みエラー:', err)
        setError(err instanceof Error ? err.message : '設定の読み込みに失敗しました')
      }
    }
    loadSettings()
  }, [])

  return {
    settings,
    isSaving,
    error,
    saveSettings,
    DEFAULT_ALARM_SOUNDS
  }
}
