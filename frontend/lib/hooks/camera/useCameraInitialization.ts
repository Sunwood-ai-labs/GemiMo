import { RefObject } from 'react'
import { CameraDeviceInfo, Resolution } from '@/lib/types/camera'

export const useCameraInitialization = () => {
  const initializeCamera = async (
    videoRef: RefObject<HTMLVideoElement>,
    deviceId: string,
    facingMode: 'user' | 'environment',
    resolution: Resolution
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element is not available')
      }

      // 既存のストリームを停止
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }

      // 新しいストリームを取得
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : facingMode,
          width: { ideal: resolution.width },
          height: { ideal: resolution.height }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve
          }
        })
      }

      return { success: true }
    } catch (err) {
      console.error('Error initializing camera:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'カメラの初期化に失敗しました'
      }
    }
  }

  return { initializeCamera }
}
