import { useEffect, useRef, useState } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { drawBox3D, drawDebugInfo, getStateColor } from '@/lib/utils/drawing'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [lastDrawTime, setLastDrawTime] = useState(performance.now())

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
      initializeCamera(videoRef, canvasRef)
    }
  }, [selectedCamera, facingMode])

  const handleRecognize = async () => {
    if (!canvasRef.current || isAnalyzing) return
    setIsAnalyzing(true)

    try {
      const canvas = canvasRef.current
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve))
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
      updateCanvas(data)
    } catch (error) {
      console.error('Error analyzing image:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateCanvas = (data: AnalysisResult) => {
    const canvas = canvasRef.current
    if (!canvas || !data.boxes) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    }
    
    Object.entries(data.boxes).forEach(([label, box]) => {
      drawBox3D(ctx, label, box, canvas.width, canvas.height)
    })
    
    drawDebugInfo(ctx, data)
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isAutoSending) {
      intervalId = setInterval(() => {
        handleRecognize()
        setTimeRemaining(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            setIsAutoSending(false)
            if (intervalId) clearInterval(intervalId)
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isAutoSending])

  useEffect(() => {
    let animationFrameId: number

    const drawVideoToCanvas = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        }
      }
      animationFrameId = requestAnimationFrame(drawVideoToCanvas)
    }

    if (hasCamera) {
      drawVideoToCanvas()
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [hasCamera])

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Camera Controls */}
      <div className="mb-4 space-y-2">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('許可') && (
              <button
                onClick={() => requestCameraPermission(videoRef, canvasRef)}
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

      {/* Camera Feed and Analysis */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-brand-primary/5 to-brand-accent/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Control Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/30">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <button
                onClick={handleRecognize}
                disabled={isAnalyzing || !hasCamera}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? '解析中...' : 'Geminiで解析'}
              </button>
            </div>
            
            {analysis && (
              <div className="flex justify-between items-center text-white">
                <p className="text-sm font-medium">状態: {analysis.state}</p>
                <p className="text-sm font-medium">
                  信頼度: {(analysis.confidence * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug View */}
      <div className="mt-4 p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Debug View</h3>
        <div className="space-y-2 text-sm font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">State:</span>
              <span className="ml-2" style={{ color: getStateColor(analysis?.state || 'UNKNOWN') }}>
                {analysis?.state || 'UNKNOWN'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Confidence:</span>
              <span className="ml-2">
                {analysis?.confidence ? (analysis.confidence * 100).toFixed(1) + '%' : 'N/A'}
              </span>
            </div>
            {analysis?.alarm && (
              <>
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <span className="ml-2">{analysis.alarm.volume.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Frequency:</span>
                  <span className="ml-2">{analysis.alarm.frequency}Hz</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
