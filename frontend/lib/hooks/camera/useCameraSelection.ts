import { useState, useEffect } from 'react'
import { CameraDeviceInfo } from '@/lib/types/camera'

export const useCameraSelection = () => {
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string>('')

  type DeviceTypeInfo = {
    type: 'webcam' | 'mobile' | 'unknown'
    facing: 'user' | 'environment'
    label: string
  }

  const determineDeviceType = (label: string, deviceId: string): DeviceTypeInfo => {
    const lowerLabel = label.toLowerCase()
    
    // ラベルがない場合はデバイスIDから判断を試みる
    if (!label) {
      return {
        type: 'unknown',
        facing: 'user' as const,
        label: `カメラ (${deviceId.slice(0, 4)})`
      }
    }

    // PCのビルトインカメラの検出
    if (lowerLabel.includes('integrated') || 
        lowerLabel.includes('built-in') || 
        lowerLabel.includes('内蔵')) {
      return {
        type: 'webcam',
        facing: 'user' as const,
        label: 'PC内蔵カメラ'
      }
    }

    // USB接続のWebカメラの検出
    if (lowerLabel.includes('usb') || 
        lowerLabel.includes('webcam') || 
        lowerLabel.includes('camera') ||
        lowerLabel.includes('cam') ||
        lowerLabel.includes('カメラ')) {
      return {
        type: 'webcam',
        facing: 'user' as const,
        label: label
      }
    }

    // スマートフォンのカメラ検出
    if (lowerLabel.includes('back') || 
        lowerLabel.includes('rear') || 
        lowerLabel.includes('環境') || 
        lowerLabel.includes('背面')) {
      return {
        type: 'mobile',
        facing: 'environment' as const,
        label: '背面カメラ'
      }
    }

    if (lowerLabel.includes('front') || 
        lowerLabel.includes('selfie') || 
        lowerLabel.includes('user') || 
        lowerLabel.includes('前面')) {
      return {
        type: 'mobile',
        facing: 'user' as const,
        label: '前面カメラ'
      }
    }

    // 不明なカメラの場合
    return {
      type: 'unknown',
      facing: 'user' as const,
      label: label || `カメラ (${deviceId.slice(0, 4)})`
    }
  }

  const updateCameraList = async () => {
    try {
      // デバイスの列挙を試みる前に、カメラアクセス権限を確認
      const initialStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      }).catch(() => {
        // 環境モードで失敗した場合、userモードで再試行
        return navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        })
      })

      // 初期ストリームは停止
      if (initialStream) {
        initialStream.getTracks().forEach(track => track.stop())
      }

      // すべてのデバイスを列挙
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      // ビデオ入力デバイスをフィルタリング
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => {
          const { type, facing, label } = determineDeviceType(device.label, device.deviceId)
          return {
            deviceId: device.deviceId,
            label: label,
            kind: 'videoinput' as const,
            type,
            facing
          }
        })

      console.log('Detected cameras:', cameras) // デバッグログ
      setAvailableCameras(cameras)

      // カメラが見つかったが選択されていない場合、最適なカメラを選択
      if (cameras.length > 0 && !selectedCamera) {
        // 優先順位: 背面カメラ > 外付けWebカメラ > 内蔵カメラ
        const defaultCamera = 
          cameras.find(cam => cam.facing === 'environment') ||
          cameras.find(cam => cam.type === 'webcam' && !cam.label.includes('内蔵')) ||
          cameras[0]

        setSelectedCamera(defaultCamera.deviceId)
        setFacingMode(defaultCamera.facing)
        console.log('Selected default camera:', defaultCamera) // デバッグログ
      }
    } catch (err) {
      console.error('Error listing cameras:', err)
      setError('カメラの一覧取得に失敗しました')
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
    
    setSelectedCamera(nextCamera.deviceId)
    setFacingMode(nextCamera.facing)
    console.log('Switched to camera:', nextCamera) // デバッグログ
  }

  useEffect(() => {
    // ページロード時とデバイスの変更時にカメラリストを更新
    updateCameraList()
    
    // デバイス変更イベントのリッスン
    const handleDeviceChange = () => {
      console.log('Device change detected') // デバッグログ
      updateCameraList()
    }
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [])

  return {
    availableCameras,
    selectedCamera,
    facingMode,
    error,
    setSelectedCamera: (deviceId: string) => {
      const camera = availableCameras.find(cam => cam.deviceId === deviceId)
      if (camera) {
        setSelectedCamera(deviceId)
        setFacingMode(camera.facing)
      }
    },
    toggleCamera,
    updateCameraList
  }
}
