import React from 'react'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'

interface CameraControlsProps {
  selectedCamera: string
  setSelectedCamera: (deviceId: string) => void
  toggleCamera: () => void
  error: string
  availableCameras: Array<{ deviceId: string; label: string }>
  selectedResolution: { width: number; height: number }
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  selectedCamera,
  setSelectedCamera,
  toggleCamera,
  error,
  availableCameras,
  selectedResolution
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
          className="px-3 py-2 rounded-lg border border-gray-200"
        >
          {availableCameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label}
            </option>
          ))}
        </select>

        <button
          onClick={toggleCamera}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          カメラ切替
        </button>
      </div>

      <div className="text-xs text-gray-600">
        解像度: {selectedResolution.width}x{selectedResolution.height}
      </div>
    </div>
  )
}
