import { useCameraDevices } from '@/lib/hooks/useCameraDevices'
import { RESOLUTION_OPTIONS } from '@/lib/types/camera'

export const CameraSettings = () => {
  const {
    availableCameras,
    selectedCamera,
    selectedResolution,
    setSelectedCamera,
    setSelectedResolution,
  } = useCameraDevices()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Default Camera
        </label>
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {availableCameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Camera ${camera.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Resolution
        </label>
        <select
          value={`${selectedResolution.width}x${selectedResolution.height}`}
          onChange={(e) => {
            const [width, height] = e.target.value.split('x').map(Number)
            const resolution = RESOLUTION_OPTIONS.find(r => r.width === width && r.height === height)
            if (resolution) setSelectedResolution(resolution)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {RESOLUTION_OPTIONS.map((res) => (
            <option key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
              {res.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
