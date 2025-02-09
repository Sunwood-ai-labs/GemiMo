import { useState, useEffect, RefObject } from 'react'
import { Resolution, RESOLUTION_OPTIONS } from '@/lib/types/camera'

export const useCameraInitialization = () => {
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

      // カメラの設定（シンプルに必要最小限の設定のみ使用）
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: resolution.width },
          height: { ideal: resolution.height }
        }
      }

      // 現在のストリームを停止
      if (videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
      }

      // 新しいストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // video要素に新しいストリームをセット
      videoRef.current.srcObject = stream
      
      // メタデータの読み込み完了を待つ
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve()
        }
      })

      return { success: true }
    } catch (err) {
      console.error('Error initializing camera:', err)
      return { success: false, error: String(err) }
    }
  }

  return { initializeCamera }
}
