import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CameraSettings } from '@/components/settings/CameraSettings'
import { ApiSettings } from '@/components/settings/ApiSettings'
import { ModelSettings } from '@/components/settings/ModelSettings'
import { RESOLUTION_OPTIONS } from '@/lib/types/camera'
import { CameraDeviceInfo } from '@/lib/types'

const MODEL_OPTIONS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-pro-preview-02-05"
] as const

export const SettingsForm = () => {
  const { settings, isSaving, error: settingsError, saveSettings } = useSettings()
  const [isInitializing, setIsInitializing] = useState(true)
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [resolution, setResolution] = useState<typeof RESOLUTION_OPTIONS[number]>(RESOLUTION_OPTIONS[1])
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState<typeof MODEL_OPTIONS[number]>("gemini-2.0-flash")
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const initializeCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
          .catch(async (err) => {
            return navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'user' } 
            })
          })

        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => {
            const label = device.label || `Camera ${device.deviceId.slice(0, 4)}`
            const lowerLabel = label.toLowerCase()
            
            const isBackCamera = lowerLabel.includes('back') || 
                               lowerLabel.includes('rear') || 
                               lowerLabel.includes('environment')

            return {
              deviceId: device.deviceId,
              label: label,
              type: lowerLabel.includes('integrated') ? 'webcam' : 'unknown',
              facing: isBackCamera ? 'environment' as const : 'user' as const
            }
          })

        setAvailableCameras(cameras)

        if (cameras.length > 0) {
          const defaultCamera = cameras.find(cam => cam.facing === 'environment') || cameras[0]
          setSelectedCameraId(defaultCamera.deviceId)
          setFacingMode(defaultCamera.facing)
        }
      } catch (err) {
        console.error('Camera initialization error:', err)
        setError('Failed to initialize camera')
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
        apiKey,
        model: selectedModel,
        cameraId: selectedCameraId,
        facingMode,
        resolution: {
          width: resolution.width,
          height: resolution.height,
          label: resolution.label
        }
      })
      setError('')
    } catch (err) {
      setError('Failed to save settings')
    }
  }

  if (isInitializing) {
    return <div className="text-center py-4">Initializing camera...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ApiSettings apiKey={apiKey} onApiKeyChange={setApiKey} />
      
      <ModelSettings
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />

      <CameraSettings
        selectedCameraId={selectedCameraId}
        facingMode={facingMode}
        resolution={resolution}
        onCameraChange={setSelectedCameraId}
        onFacingModeChange={setFacingMode}
        onResolutionChange={(newResolution) => setResolution(newResolution)}
        availableCameras={availableCameras}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {settingsError && <p className="text-red-500 text-sm">{settingsError}</p>}
      
      <button
        type="submit"
        disabled={isSaving}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
