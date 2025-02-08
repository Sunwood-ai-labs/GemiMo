import { useEffect, useRef, useState } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'
import { DebugCanvas } from './DebugCanvas'
import { DebugInfo } from './DebugInfo'

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const {
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
  } = useCameraDevices()

  useEffect(() => {
    if (selectedCamera) {
      initializeCamera(videoRef, null)
    }
  }, [selectedCamera, facingMode])

  const handleRecognize = async () => {
    if (!videoRef.current || isAnalyzing) return
    setIsAnalyzing(true)

    try {
      // Create a temporary canvas to capture the current frame
      const tempCanvas = document.createElement('canvas')
      const video = videoRef.current
      tempCanvas.width = video.videoWidth
      tempCanvas.height = video.videoHeight
      const ctx = tempCanvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')
      
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
      
      const blob = await new Promise<Blob | null>((resolve) => tempCanvas.toBlob(resolve))
      if (!blob) throw new Error('Failed to convert canvas to blob')

      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error('Error analyzing image:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Camera Controls */}
      <div className="mb-4 space-y-2">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('許可') && (
              <button
                onClick={() => requestCameraPermission(videoRef, null)}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                カメラの使用を許可する
              </button>
            )}
          </div>
        )}
        
        {/* Camera Selection */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
            <option value="">カメラを選択</option>
            {availableCameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={toggleCamera}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/80"
          >
            {facingMode === 'user' ? '背面カメラ' : 'フロントカメラ'}
          </button>
          
          <button
            onClick={updateCameraList}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            更新
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-brand-primary/5 to-brand-accent/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Control Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/30">
          <div className="flex justify-between items-center">
            <button
              onClick={handleRecognize}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Frame'}
            </button>
          </div>
        </div>
      </div>

      {/* Debug View */}
      <div className="mt-4 p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Debug View</h3>
        
        {/* Debug Canvases */}
        <DebugCanvas
          videoRef={videoRef}
          analysis={analysis}
          facingMode={facingMode}
        />

        {/* Debug Info */}
        <DebugInfo analysis={analysis} />
      </div>
    </div>
  )
}
