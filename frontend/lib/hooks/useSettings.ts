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

  // 設定の読み込み
  const loadSettings = async () => {
    try {
      // APIキーとモデルの設定を取得
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      // ローカルストレージからカメラ設定を取得
      const savedCameraId = localStorage.getItem('preferredCameraId')
      const savedFacingMode = localStorage.getItem('preferredFacingMode')
      const savedResolution = localStorage.getItem('preferredResolution')

      setSettings(prev => ({
        ...prev,
        apiKey: data.apiKey || '',
        model: data.model || 'gemini-2.0-flash',
        cameraId: savedCameraId || '',
        facingMode: (savedFacingMode as 'user' | 'environment') || 'environment',
        resolution: savedResolution ? JSON.parse(savedResolution) : prev.resolution
      }))
      setError(null)
    } catch (err) {
      setError('Failed to load settings')
      console.error('Error loading settings:', err)
    }
  }

  // 設定の保存
  const saveSettings = async (newSettings: Partial<Settings>) => {
    setIsSaving(true)
    try {
      // APIキーとモデルの設定を保存
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: newSettings.apiKey,
          model: newSettings.model,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      // カメラ設定をローカルストレージに保存
      if (newSettings.cameraId) {
        localStorage.setItem('preferredCameraId', newSettings.cameraId)
      }
      if (newSettings.facingMode) {
        localStorage.setItem('preferredFacingMode', newSettings.facingMode)
      }
      if (newSettings.resolution) {
        localStorage.setItem('preferredResolution', JSON.stringify(newSettings.resolution))
      }

      // 状態を更新
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }))
      setError(null)
    } catch (err) {
      setError('Failed to save settings')
      console.error('Error saving settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // 初期設定の読み込み
  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    isSaving,
    error,
    saveSettings,
    loadSettings
  }
}
