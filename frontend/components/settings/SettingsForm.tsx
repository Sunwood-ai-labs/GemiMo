import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CameraSettings } from './CameraSettings'
import { ApiSettings } from './ApiSettings'
import { ModelSettings } from './ModelSettings'
import { RESOLUTION_OPTIONS } from '@/lib/types/camera'

export const SettingsForm = () => {
  const { settings, isSaving, error, saveSettings } = useSettings()
  const [availableCameras, setAvailableCameras] = useState<Array<{ deviceId: string; label: string }>>([])

  useEffect(() => {
    // カメラデバイスの一覧を取得
    const listCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 4)}...`
          }))
        setAvailableCameras(cameras)
      } catch (err) {
        console.error('Error listing cameras:', err)
      }
    }

    listCameras()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveSettings(settings)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <ApiSettings
        apiKey={settings.apiKey}
        onApiKeyChange={(apiKey) => saveSettings({ ...settings, apiKey })}
      />

      <ModelSettings
        selectedModel={settings.model as any}
        onModelChange={(model) => saveSettings({ ...settings, model })}
      />

      <CameraSettings
        selectedCameraId={settings.cameraId}
        facingMode={settings.facingMode}
        resolution={settings.resolution}
        onCameraChange={(cameraId) => saveSettings({ ...settings, cameraId })}
        onFacingModeChange={(facingMode) => saveSettings({ ...settings, facingMode })}
        onResolutionChange={(resolution) => saveSettings({ ...settings, resolution })}
        availableCameras={availableCameras}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </form>
  )
}
