import { useEffect, useRef, useState } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { drawBox3D, drawDebugInfo, getStateColor } from '@/lib/utils/drawing'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debugCanvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isInputModalOpen, setIsInputModalOpen] = useState(false)
  const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false)

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
      initializeCamera(videoRef)
    }
  }, [selectedCamera, facingMode])

  const handleRecognize = async () => {
    if (!canvasRef.current || isAnalyzing) return
    setIsAnalyzing(true)

    try {
      const canvas = canvasRef.current
      // 現在のフレームをBase64画像として保存
      const imageData = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageData)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'))
      if (!blob) throw new Error('Failed to convert canvas to blob')

      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const data = await response.json()
      setAnalysis(data)
      updateDebugCanvas(data)
    } catch (error) {
      console.error('Error analyzing image:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateDebugCanvas = (data: AnalysisResult) => {
    const canvas = debugCanvasRef.current
    if (!canvas || !capturedImage) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Load and draw the captured image
    const img = new Image()
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw the image
      ctx.drawImage(img, 0, 0)
      
      // Draw bounding boxes and debug info
      if (data.boxes) {
        Object.entries(data.boxes).forEach(([label, box]) => {
          drawBox3D(ctx, label, box, canvas.width, canvas.height)
        })
      }
      drawDebugInfo(ctx, data)
    }
    img.src = capturedImage
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
                onClick={() => requestCameraPermission(videoRef)}
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

      {/* Input Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isInputModalOpen ? '' : 'hidden'}`}
           onClick={() => setIsInputModalOpen(false)}>
        <div className="fixed inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 max-w-4xl w-full mx-4">
          <img
            src={capturedImage || ''}
            alt="Input frame"
            className="w-full rounded-lg shadow-xl"
          />
        </div>
      </div>

      {/* Visualization Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isVisualizationModalOpen ? '' : 'hidden'}`}
           onClick={() => setIsVisualizationModalOpen(false)}>
        <div className="fixed inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 max-w-4xl w-full mx-4">
          <canvas
            ref={debugCanvasRef}
            className="w-full rounded-lg shadow-xl"
          />
        </div>
      </div>

      {/* Debug View */}
      <div className="mt-4 p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Debug View</h3>
        <div 
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsDebugModalOpen(true)}
        >
          <canvas 
            ref={debugCanvasRef}
            className="w-full h-64 object-contain rounded-lg"
          />
        </div>
      </div>

      {/* Debug Modal */}
      {isDebugModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsDebugModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-lg p-2 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <canvas
              ref={debugCanvasRef}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
}
