import { useState, useEffect } from 'react'
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
          label: device.label || `Camera ${device.deviceId.slice(0, 4)}...`,
          kind: device.kind as 'videoinput'
        }))

      setAvailableCameras(cameras)

      // カメラが見つかったが選択されていない場合、デフォルトを設定
      if (cameras.length > 0 && !selectedCamera) {
        const defaultCamera = cameras.find(camera => {
          const label = camera.label.toLowerCase()
          return label.includes('back') || label.includes('rear') || 
                 label.includes('環境') || label.includes('背面')
        })
        
        if (defaultCamera) {
          setSelectedCamera(defaultCamera.deviceId)
          setFacingMode('environment')
        } else {
          setSelectedCamera(cameras[0].deviceId)
          setFacingMode('user')
        }
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

    const label = nextCamera.label.toLowerCase()
    const isBackCamera = label.includes('back') || label.includes('rear') || 
                        label.includes('環境') || label.includes('背面')
    
    setFacingMode(isBackCamera ? 'environment' : 'user')
    setSelectedCamera(nextCamera.deviceId)
  }

  useEffect(() => {
    updateCameraList()
    navigator.mediaDevices.addEventListener('devicechange', updateCameraList)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateCameraList)
    }
  }, [])

  return {
    availableCameras,
    selectedCamera,
    facingMode,
    setSelectedCamera,
    toggleCamera,
    updateCameraList
  }
}
