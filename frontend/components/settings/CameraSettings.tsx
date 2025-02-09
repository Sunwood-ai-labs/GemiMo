import { RESOLUTION_OPTIONS } from '@/lib/types/camera'

interface CameraDeviceInfo {
  deviceId: string
  label: string
  type: string
  facing: 'user' | 'environment'
}

interface CameraSettingsProps {
  selectedCameraId: string
  facingMode: 'user' | 'environment'
  resolution: { width: number; height: number; label: string }
  onCameraChange: (cameraId: string) => void
  onFacingModeChange: (mode: 'user' | 'environment') => void
  onResolutionChange: (resolution: typeof RESOLUTION_OPTIONS[number]) => void
  availableCameras: CameraDeviceInfo[]
}

export const CameraSettings: React.FC<CameraSettingsProps> = ({
  selectedCameraId,
  facingMode,
  resolution,
  onCameraChange,
  onFacingModeChange,
  onResolutionChange,
  availableCameras
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display text-gray-800">Camera Settings</h3>
      
      {/* Camera Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Camera Device
        </label>
        <select
          value={selectedCameraId}
          onChange={(e) => onCameraChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          {availableCameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label}
            </option>
          ))}
        </select>
      </div>

      {/* Camera Facing Mode */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Camera Direction
        </label>
        <select
          value={facingMode}
          onChange={(e) => onFacingModeChange(e.target.value as 'user' | 'environment')}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          <option value="user">Front Camera</option>
          <option value="environment">Back Camera</option>
        </select>
      </div>

      {/* Resolution Settings */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Resolution
        </label>
        <select
          value={`${resolution.width}x${resolution.height}`}
          onChange={(e) => {
            const selected = RESOLUTION_OPTIONS.find(
              opt => `${opt.width}x${opt.height}` === e.target.value
            )
            if (selected) onResolutionChange(selected)
          }}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          {RESOLUTION_OPTIONS.map((opt) => (
            <option key={opt.label} value={`${opt.width}x${opt.height}`}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
