import { useState, useEffect, RefObject } from 'react'
import { CameraDeviceInfo, FacingMode, Resolution, RESOLUTION_OPTIONS } from '../types/camera'

export const useCameraDevices = () => {
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [error, setError] = useState<string>('')
  const [hasCamera, setHasCamera] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(RESOLUTION_OPTIONS[1]) // HD by default

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

  const initializeCamera = async (videoRef: RefObject<HTMLVideoElement>) => {
    try {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: !selectedCamera ? facingMode : undefined,
          width: { ideal: selectedResolution.width },
          height: { ideal: selectedResolution.height },
          frameRate: { ideal: 30 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight
            console.log('Camera initialized with resolution:', 
              videoRef.current.videoWidth, 'x', videoRef.current.videoHeight)
          }
        }
        
        setHasCamera(true)
        setError('')

        const videoTrack = stream.getVideoTracks()[0]
        console.log('Using camera:', videoTrack.label)

        // 実際の解像度を取得して更新
        const settings = videoTrack.getSettings()
        if (settings.width && settings.height) {
          const actualResolution = RESOLUTION_OPTIONS.find(
            res => res.width === settings.width && res.height === settings.height
          )
          if (actualResolution) {
            setSelectedResolution(actualResolution)
          }
        }
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

  const requestCameraPermission = async (videoRef: RefObject<HTMLVideoElement>) => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      updateCameraList()
      initializeCamera(videoRef)
    } catch (err) {
      console.error('Error requesting camera permission:', err)
      if (err instanceof Error) {
        setError('カメラの使用許可が必要です。許可を求められたら「許可」をクリックしてください。')
      }
    }
  }

  useEffect(() => {
    // 保存された設定を読み込む
    const savedResolution = localStorage.getItem('preferredResolution')
    if (savedResolution) {
      try {
        const resolution = JSON.parse(savedResolution)
        const found = RESOLUTION_OPTIONS.find(
          opt => opt.width === resolution.width && opt.height === resolution.height
        )
        if (found) setSelectedResolution(found)
      } catch (e) {
        console.error('Error parsing saved resolution:', e)
      }
    }

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
    error,
    hasCamera,
    selectedResolution,
    setSelectedCamera,
    setSelectedResolution,
    toggleCamera,
    initializeCamera,
    requestCameraPermission,
    updateCameraList
  }
}
