import { useState, useRef, useEffect } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { drawBox3D, drawDebugInfo, getStateColor } from '@/lib/utils/drawing'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'
import { DebugCanvas } from './DebugCanvas'
import { DebugInfo } from './DebugInfo'
import { AnalysisPanel } from './analysis/AnalysisPanel'
import { CameraControls } from './camera/CameraControls'
import { CameraPreview } from './camera/CameraPreview'

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  const cameraProps = useCameraDevices()

  useEffect(() => {
    if (cameraProps.selectedCamera) {
      cameraProps.initializeCamera(videoRef)
    }
  }, [cameraProps.selectedCamera, cameraProps.facingMode, cameraProps.selectedResolution])

  const handleAnalyze = async () => {
    if (!canvasRef.current || !videoRef.current || isAnalyzing) return
    setIsAnalyzing(true)
    setProcessingStatus('画像の準備中...')

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      // キャンバスのサイズをビデオのサイズに合わせる
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // ビデオフレームをキャンバスに描画
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // 現在のフレームをBase64画像として保存
      setProcessingStatus('画像のキャプチャ中...')
      const imageData = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageData)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      setProcessingStatus('画像データの変換中...')
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'))
      if (!blob) throw new Error('Failed to convert canvas to blob')

      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      setProcessingStatus('分析リクエスト送信中...')
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${errorText}`)
      }

      setProcessingStatus('分析結果の処理中...')
      const data = await response.json()
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Unknown error occurred')
      }
      
      setAnalysis(data.raw_result)
      setProcessingStatus('分析完了')

    } catch (error) {
      console.error('Error analyzing image:', error)
      setProcessingStatus(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setTimeout(() => {
        setProcessingStatus('')
        setIsAnalyzing(false)
      }, 2000)
    }
  }

  return (
    <div className="w-full mx-auto">
      <CameraControls 
        selectedCamera={cameraProps.selectedCamera}
        setSelectedCamera={cameraProps.setSelectedCamera}
        toggleCamera={cameraProps.toggleCamera}
        error={cameraProps.error}
        availableCameras={cameraProps.availableCameras}
        selectedResolution={cameraProps.selectedResolution}
      />

      <div className="relative">
        <CameraPreview
          videoRef={videoRef}
          facingMode={cameraProps.facingMode}
          isAnalyzing={isAnalyzing}
          processingStatus={processingStatus}
        />

        {/* Hidden canvas for capture */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        />

        {/* Analysis Control Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/30">
          <div className="flex justify-between items-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg disabled:opacity-50"
            >
              {isAnalyzing ? '解析中...' : '解析する'}
            </button>
          </div>
        </div>
      </div>

      <AnalysisPanel analysis={analysis} />

      <div className="mt-8 p-6 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
        <h3 className="text-lg font-medium text-gray-800 mb-4">解析結果</h3>
        <div className="space-y-6">
          <DebugCanvas 
            videoRef={videoRef}
            analysis={analysis}
            facingMode={cameraProps.facingMode}
            capturedImage={capturedImage}
          />
          <DebugInfo analysis={analysis} />
        </div>
      </div>
    </div>
  )
}
