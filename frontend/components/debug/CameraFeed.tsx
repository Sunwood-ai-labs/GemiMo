import { useEffect, useRef, useState } from 'react'

interface Box3D {
  position: [number, number, number] // [x, y, z]
  dimensions: [number, number, number] // [width, height, depth]
  rotation: [number, number, number] // [roll, pitch, yaw]
  confidence: number
}

interface AnalysisResult {
  boxes?: Record<string, Box3D>
  state?: string
  confidence?: number
  position?: [number, number, number]
  orientation?: [number, number, number]
  timestamp?: number
  alarm?: {
    volume: number
    frequency: number
  }
}

interface CameraDeviceInfo {
  deviceId: string
  label: string
  kind: 'videoinput'
}

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  useEffect(() => {
    // カメラデバイスの一覧を取得
    const listCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
            kind: device.kind as 'videoinput'
          }))
        setAvailableCameras(cameras)
        // デフォルトで最初のカメラを選択
        if (cameras.length > 0 && !selectedCamera) {
          setSelectedCamera(cameras[0].deviceId)
        }
      } catch (err) {
        console.error('Error listing cameras:', err)
        setError('カメラの一覧取得に失敗しました')
      }
    }

    listCameras()
  }, [])

  useEffect(() => {
    if (selectedCamera) {
      initializeCamera()
    }
  }, [selectedCamera, facingMode])

  const initializeCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }

      // まずカメラの権限を要求
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (permission.state === 'denied') {
        throw new Error('カメラへのアクセスが拒否されています。ブラウザの設定からカメラの使用を許可してください。')
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setHasCamera(true)
        setError('')
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
          setError(`カメラへのアクセスに失敗しました: ${err.message}`)
        }
      } else {
        setError('カメラへのアクセスに失敗しました。')
      }
    }
  }

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      initializeCamera()
    } catch (err) {
      console.error('Error requesting camera permission:', err)
      if (err instanceof Error) {
        setError('カメラの使用許可が必要です。許可を求められたら「許可」をクリックしてください。')
      }
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleRecognize = async () => {
    if (!canvasRef.current || isAnalyzing) return
    setIsAnalyzing(true)

    const canvas = canvasRef.current
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      // Canvas の画像をBlobに変換
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve))
      if (!blob) {
        throw new Error('Failed to convert canvas to blob')
      }

      // FormDataの作成
      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      // APIにPOSTリクエストを送信
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      setAnalysis(data)
      updateCanvas(data)
    } catch (error) {
      console.error('Error analyzing image:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleAutoSend = () => {
    if (!isAutoSending) {
      setTimeRemaining(5) // 5秒間の認識を開始
      setIsAutoSending(true)
    } else {
      setIsAutoSending(false)
      setTimeRemaining(0)
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isAutoSending) {
      // 1秒ごとに実行
      intervalId = setInterval(() => {
        handleRecognize()
        setTimeRemaining(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            // 5秒経過したら停止
            setIsAutoSending(false)
            if (intervalId) clearInterval(intervalId)
          }
          return newTime
        })
      }, 1000) // 1fps
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isAutoSending])

  const updateCanvas = (data: AnalysisResult) => {
    const canvas = canvasRef.current
    if (!canvas || !data.boxes) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw 3D bounding boxes
    Object.entries(data.boxes).forEach(([label, box]) => {
      const { position: [x, y, z], dimensions: [width, height, depth], rotation: [roll, pitch, yaw] } = box
      ctx.strokeStyle = label === 'person' ? '#00ff00' : '#0000ff'
      ctx.lineWidth = 2

      // Simple 2D projection of 3D box
      const scale = 1 / (z + 5) // Basic perspective
      const projectedWidth = width * scale
      const projectedHeight = height * scale

      ctx.strokeRect(
        x - projectedWidth / 2,
        y - projectedHeight / 2,
        projectedWidth,
        projectedHeight
      )

      // Label
      ctx.fillStyle = 'white'
      ctx.fillText(label, x - projectedWidth / 2, y - projectedHeight / 2 - 5)
    })

    // Draw sleep state indicator
    ctx.fillStyle = getStateColor(data.state)
    ctx.font = '24px Arial'
    ctx.fillText(data.state, 10, 30)
    ctx.fillText(`Confidence: ${(data.confidence * 100).toFixed(1)}%`, 10, 60)
  }

  const draw3DBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    pitch: number
  ) => {
    const canvas = ctx.canvas
    const scale = 100
    const centerX = canvas.width / 2 + x * scale
    const centerY = canvas.height / 2 + y * scale

    // Apply perspective transform based on pitch
    const perspective = Math.cos(pitch * Math.PI / 180)
    const boxWidth = width * scale * perspective
    const boxHeight = height * scale

    ctx.beginPath()
    ctx.rect(
      centerX - boxWidth / 2,
      centerY - boxHeight / 2,
      boxWidth,
      boxHeight
    )
    ctx.stroke()
  }

  const getStateColor = (state: string): string => {
    const colors = {
      SLEEPING: '#4CAF50',
      STRUGGLING: '#FFC107',
      AWAKE: '#2196F3',
      UNKNOWN: '#9E9E9E'
    }
    return colors[state as keyof typeof colors] || colors.UNKNOWN
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4 space-y-2">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('許可') && (
              <button
                onClick={requestCameraPermission}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                カメラの使用を許可する
              </button>
            )}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
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
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="relative aspect-[4/3] bg-gradient-to-b from-brand-primary/5 to-brand-accent/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <canvas 
          ref={canvasRef} 
          width={1280}
          height={960}
          className="absolute inset-0 w-full h-full"
        />

        <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/30">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <button
                  onClick={handleRecognize}
                  disabled={isAnalyzing || !hasCamera}
                  className={`px-4 py-2 rounded-full text-sm ${
                    isAnalyzing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-brand-primary hover:bg-brand-primary/80'
                  } text-white font-medium transition-colors`}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Recognize'}
                </button>
                <button
                  onClick={toggleAutoSend}
                  className={`px-4 py-2 rounded-full text-sm ${
                    isAutoSending 
                      ? 'bg-brand-accent text-gray-800' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  } font-medium transition-colors`}
                >
                  {isAutoSending ? `停止 (${timeRemaining}秒)` : '自動認識 (5秒)'}
                </button>
              </div>
            </div>
            {analysis && (
              <div className="flex justify-between items-center text-white">
                <p className="text-sm font-medium">{analysis.state}</p>
                <p className="text-xs opacity-80">
                  Confidence: {(analysis.confidence * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-optimized stats panels */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
          <h3 className="text-gray-800 text-sm font-medium mb-2">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${hasCamera ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600">Camera</span>
              </div>
              <span className="text-xs text-gray-500">{hasCamera ? 'Connected' : 'No Access'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm text-gray-600">Analysis</span>
              </div>
              <span className="text-xs text-gray-500">
                {isAnalyzing ? 'Processing' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
