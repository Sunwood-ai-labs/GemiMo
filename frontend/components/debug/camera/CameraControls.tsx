import { CameraDeviceInfo, Resolution } from '@/lib/types/camera'

interface CameraControlsProps {
  availableCameras: CameraDeviceInfo[]
  selectedCamera: string
  selectedResolution: Resolution
  error?: string
  setSelectedCamera: (deviceId: string) => void
  toggleCamera: () => void
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  availableCameras,
  selectedCamera,
  selectedResolution,
  error,
  setSelectedCamera,
  toggleCamera,
}) => {
  return (
    <div className="mb-4 space-y-2">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          {availableCameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Camera ${camera.deviceId}`}
            </option>
          ))}
        </select>

        <button
          onClick={toggleCamera}
          className="px-4 py-2 bg-brand-primary text-white rounded-md"
        >
          Switch Camera
        </button>
      </div>

      <div className="text-xs text-gray-600">
        Resolution: {selectedResolution.width}x{selectedResolution.height}
      </div>
    </div>
  )
}
