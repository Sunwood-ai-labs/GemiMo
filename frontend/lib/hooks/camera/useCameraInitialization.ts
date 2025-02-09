import { useState, useEffect, RefObject } from 'react'
import { Resolution, RESOLUTION_OPTIONS } from '@/lib/types/camera'

export const useCameraInitialization = () => {
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(RESOLUTION_OPTIONS[1])
  const [error, setError] = useState<string>('')

  const initializeCamera = async (
    videoRef: RefObject<HTMLVideoElement>,
    deviceId: string,
    facingMode: 'user' | 'environment',
    resolution: Resolution
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!videoRef.current) {
        return { success: false, error: 'Video element not found' }
      }

      // 既存のストリームを停止
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }

      let stream: MediaStream | null = null
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: !deviceId ? { exact: facingMode } : undefined,
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
          frameRate: { ideal: 30 }
        }
      }

      try {
        // 最初に指定された制約で試行
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (initialError) {
        console.warn('Failed with initial constraints, trying fallback:', initialError)
        
        // フォールバック1: deviceIdをidealに変更
        try {
          const fallbackConstraints1 = {
            ...constraints,
            video: {
              ...(constraints.video as MediaTrackConstraints),
              deviceId: deviceId ? { ideal: deviceId } : undefined
            }
          }
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints1)
        } catch (fallback1Error) {
          // フォールバック2: 解像度を下げる
          try {
            const fallbackConstraints2 = {
              audio: false,
              video: {
                deviceId: deviceId ? { ideal: deviceId } : undefined,
                facingMode: !deviceId ? { ideal: facingMode } : undefined,
                width: { ideal: 640 },
                height: { ideal: 480 }
              }
            }
            stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints2)
          } catch (fallback2Error) {
            // フォールバック3: 最小限の制約で試行
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: deviceId ? { deviceId: { ideal: deviceId } } : true
              })
            } catch (finalError) {
              throw new Error('カメラの初期化に失敗しました')
            }
          }
        }
      }

      if (!stream) {
        throw new Error('カメラストリームの取得に失敗しました')
      }

      videoRef.current.srcObject = stream
      
      // メタデータの読み込みを待機
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject('Video element not found')
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            console.log('Video metadata loaded:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            })
            resolve()
          }
        }
        
        videoRef.current.onerror = () => {
          reject('Video loading failed')
        }

        // タイムアウト設定（5秒）
        setTimeout(() => reject('Video loading timed out'), 5000)
      })

      const videoTrack = stream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()
      console.log('Camera initialized with settings:', settings)

      // カメラの詳細設定を最適化
      try {
        const capabilities = videoTrack.getCapabilities()
        if (capabilities.whiteBalanceMode) {
          await videoTrack.applyConstraints({
            whiteBalanceMode: 'continuous',
            exposureMode: 'continuous',
            focusMode: 'continuous'
          })
        }
      } catch (optimizationError) {
        console.warn('Failed to apply optimization settings:', optimizationError)
      }

      return { 
        success: true,
        streamInfo: {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          deviceId: settings.deviceId
        }
      }

    } catch (err) {
      console.error('Error initializing camera:', err)
      const errorMessage = err instanceof Error ? err.message : 'カメラの初期化に失敗しました'
      setError(errorMessage)
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  return {
    selectedResolution,
    setSelectedResolution,
    error,
    initializeCamera
  }
}
