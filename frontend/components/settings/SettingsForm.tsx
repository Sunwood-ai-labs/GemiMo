import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CameraSettings } from './CameraSettings'
import { ApiSettings } from './ApiSettings'
import { ModelSettings } from './ModelSettings'
import { RESOLUTION_OPTIONS } from '@/lib/types/camera'

export const SettingsForm = () => {
  const { settings, isSaving, error: settingsError, saveSettings } = useSettings()
  const [isInitializing, setIsInitializing] = useState(true)
  const [availableCameras, setAvailableCameras] = useState<Array<{ deviceId: string; label: string; type: string; facing: 'user' | 'environment' }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [resolution, setResolution] = useState(RESOLUTION_OPTIONS[1])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const initializeCameras = async () => {
      try {
        // カメラの権限を要求
        await navigator.mediaDevices.getUserMedia({ video: true })
          .catch(async (err) => {
            // 環境モードで失敗した場合、userモードで再試行
            return navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'user' } 
            })
          })

        // すべてのデバイスを列挙
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => {
            const label = device.label || `カメラ ${device.deviceId.slice(0, 4)}`
            const lowerLabel = label.toLowerCase()
            
            // カメラの種類と向きを判定
            const isBackCamera = lowerLabel.includes('back') || 
                               lowerLabel.includes('rear') || 
                               lowerLabel.includes('環境') || 
                               lowerLabel.includes('背面')
            
            const isBuiltIn = lowerLabel.includes('integrated') || 
                            lowerLabel.includes('built-in') || 
                            lowerLabel.includes('内蔵')

            return {
              deviceId: device.deviceId,
              label: label,
              type: isBuiltIn ? 'webcam' : 'unknown',
              facing: isBackCamera ? 'environment' : 'user'
            }
          })

        console.log('Available cameras:', cameras) // デバッグ用
        setAvailableCameras(cameras)

        // カメラの選択
        if (cameras.length > 0) {
          const defaultCamera = cameras.find(cam => cam.facing === 'environment') || cameras[0]
          setSelectedCameraId(defaultCamera.deviceId)
          setFacingMode(defaultCamera.facing)
        }
      } catch (err) {
        console.error('Camera initialization error:', err)
        setError('カメラの初期化に失敗しました')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeCameras()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveSettings({
        ...settings,
        cameraId: selectedCameraId,
        facingMode,
        resolution
      })
    } catch (err) {
      console.error('Settings save error:', err)
      setError('設定の保存に失敗しました')
    }
  }

  if (isInitializing) {
    return <div className="text-center py-4">カメラを初期化中...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <CameraSettings
        selectedCameraId={selectedCameraId}
        facingMode={facingMode}
        resolution={resolution}
        onCameraChange={setSelectedCameraId}
        onFacingModeChange={setFacingMode}
        onResolutionChange={setResolution}
        availableCameras={availableCameras}
      />
      
      <ApiSettings
        apiKey={settings.apiKey}
        onApiKeyChange={(key) => saveSettings({ ...settings, apiKey: key })}
      />
      
      <ModelSettings
        selectedModel={settings.model}
        onModelChange={(model) => saveSettings({ ...settings, model })}
      />

      {(error || settingsError) && (
        <div className="text-red-500 text-sm">
          {error || settingsError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </form>
  )
}
