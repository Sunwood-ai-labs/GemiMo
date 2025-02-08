import { useState, useEffect } from 'react'
import { CameraDeviceInfo, FacingMode } from '@/lib/types/camera'

export const useCameraDevices = () => {
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [error, setError] = useState<string>('')
  const [hasCamera, setHasCamera] = useState(false)

  const updateCameraList = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
          kind: 'videoinput' as const
        }))

      setAvailableCameras(cameras)
      if (cameras.length > 0 && !selectedCamera) {
        const defaultCamera = cameras.find(camera => {
          const label = camera.label.toLowerCase()
          return label.includes('back') || 
                 label.includes('rear') || 
                 label.includes('environment') ||
                 label.includes('背面') ||
                 label.includes('外側')
        }) || cameras[0]

        setSelectedCamera(defaultCamera.deviceId)
        setFacingMode('environment')
      }
    } catch (err) {
      console.error('Error listing cameras:', err)
      setError('カメラの一覧取得に失敗しました。カメラへのアクセスを許可してください。')
    }
  }

  const initializeCamera = async (videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: !selectedCamera ? facingMode : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
          }
        }
        
        setHasCamera(true)
        setError('')

        const videoTrack = stream.getVideoTracks()[0]
        console.log('Using camera:', videoTrack.label)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setHasCamera(false)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          setError('カメラの使用が許可されていません。ブラウザの設定で許可してください。')
        } else if (err.name === 'NotFoundError') {
          setError('カメラが見つかりません。デバイスにカメラが接続されているか確認してください。')
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          setError('カメラにアクセスできません。他のアプリがカメラを使用している可能性があります。')
        } else {
          setError(`カメラの初期化に失敗しました: ${err.message}`)
        }
      }
    }
  }

  const toggleCamera = () => {
    if (availableCameras.length < 2) {
      setError('切り替え可能なカメラがありません')
      return
    }

    const currentIndex = availableCameras.findIndex(camera => camera.deviceId === selectedCamera)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]

    const label = nextCamera.label.toLowerCase()
    const isBackCamera = label.includes('back') || label.includes('rear') || 
                        label.includes('environment') || label.includes('背面') || 
                        label.includes('外側')
    setFacingMode(isBackCamera ? 'environment' : 'user')
    setSelectedCamera(nextCamera.deviceId)
  }

  const requestCameraPermission = async (videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      initializeCamera(videoRef, canvasRef)
    } catch (err) {
      console.error('Error requesting camera permission:', err)
      if (err instanceof Error) {
        setError('カメラの使用許可が必要です。許可を求められたら「許可」をクリックしてください。')
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    updateCameraList()
    navigator.mediaDevices.addEventListener('devicechange', updateCameraList)

    return () => {
      mounted = false
      navigator.mediaDevices.removeEventListener('devicechange', updateCameraList)
    }
  }, [])

  return {
    availableCameras,
    selectedCamera,
    facingMode,
    error,
    hasCamera,
    setSelectedCamera,
    toggleCamera,
    initializeCamera,
    requestCameraPermission,
    updateCameraList
  }
}
