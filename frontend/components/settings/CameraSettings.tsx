import { RESOLUTION_OPTIONS } from '@/lib/types/camera'

interface CameraSettingsProps {
  selectedCameraId: string
  facingMode: 'user' | 'environment'
  resolution: { width: number; height: number; label: string }
  onCameraChange: (cameraId: string) => void
  onFacingModeChange: (mode: 'user' | 'environment') => void
  onResolutionChange: (resolution: typeof RESOLUTION_OPTIONS[number]) => void
  availableCameras: Array<{ deviceId: string; label: string }>
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
      <h3 className="text-lg font-medium text-gray-800">カメラ設定</h3>
      
      {/* カメラ選択 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          カメラ
        </label>
        <select
          value={selectedCameraId}
          onChange={(e) => onCameraChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {availableCameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label}
            </option>
          ))}
        </select>
      </div>

      {/* カメラの向き */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          カメラの向き
        </label>
        <select
          value={facingMode}
          onChange={(e) => onFacingModeChange(e.target.value as 'user' | 'environment')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          <option value="user">フロントカメラ</option>
          <option value="environment">リアカメラ</option>
        </select>
      </div>

      {/* 解像度設定 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          解像度
        </label>
        <select
          value={`${resolution.width}x${resolution.height}`}
          onChange={(e) => {
            const selected = RESOLUTION_OPTIONS.find(
              opt => `${opt.width}x${opt.height}` === e.target.value
            )
            if (selected) onResolutionChange(selected)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
