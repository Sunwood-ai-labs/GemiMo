import { useState, RefObject } from 'react'
import { Resolution, RESOLUTION_OPTIONS } from '../types/camera'
import { useCameraPermission } from '../hooks/camera/useCameraPermission'
import { useCameraSelection } from '../hooks/camera/useCameraSelection'
import { useCameraInitialization } from '../hooks/camera/useCameraInitialization'

export const useCameraDevices = () => {
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(RESOLUTION_OPTIONS[1]) // HD by default
  const { hasPermission, error: permissionError, requestPermission } = useCameraPermission()
  const { 
    availableCameras, 
    selectedCamera, 
    facingMode, 
    setSelectedCamera, 
    toggleCamera, 
    updateCameraList 
  } = useCameraSelection()
  const { initializeCamera } = useCameraInitialization()

  const initialize = async (videoRef: RefObject<HTMLVideoElement>) => {
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) return
    }

    if (selectedCamera) {
      const result = await initializeCamera(videoRef, selectedCamera, facingMode, selectedResolution)
      if (!result.success) {
        console.error('Failed to initialize camera:', result.error)
      }
    }
  }

  return {
    availableCameras,
    selectedCamera,
    facingMode,
    selectedResolution,
    error: permissionError,
    hasCamera: hasPermission && availableCameras.length > 0,
    setSelectedCamera,
    setSelectedResolution,
    toggleCamera,
    initializeCamera: initialize,
    requestCameraPermission: requestPermission,
    updateCameraList
  }
}
