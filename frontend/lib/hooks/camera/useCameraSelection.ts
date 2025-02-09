import { useState } from 'react'
import { CameraDeviceInfo } from '@/lib/types/camera'

export const useCameraSelection = () => {
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const updateCameraList = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label,
          kind: 'videoinput'
        }))
      setAvailableCameras(cameras)

      if (cameras.length > 0 && !selectedCamera) {
        const defaultCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear'))
        setSelectedCamera(defaultCamera?.deviceId || cameras[0].deviceId)
      }
    } catch (err) {
      console.error('Error listing cameras:', err)
    }
  }

  const toggleCamera = () => {
    if (availableCameras.length < 2) return
    
    const currentIndex = availableCameras.findIndex(camera => camera.deviceId === selectedCamera)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    
    const isBackCamera = nextCamera.label.toLowerCase().match(/back|rear|environment|背面|外側/)
    setFacingMode(isBackCamera ? 'environment' : 'user')
    setSelectedCamera(nextCamera.deviceId)
  }

  return {
    availableCameras,
    selectedCamera,
    facingMode,
    setSelectedCamera,
    toggleCamera,
    updateCameraList
  }
}
