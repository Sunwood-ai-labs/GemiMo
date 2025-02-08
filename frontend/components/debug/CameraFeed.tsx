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
    let mounted = true;

    const updateCameraList = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // カメラのアクセス許可を要求
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
            kind: device.kind as 'videoinput'
          }))
        
        if (mounted) {
          setAvailableCameras(cameras)
          // カメラが検出された場合の初期選択
          if (cameras.length > 0 && !selectedCamera) {
            // カメラの種類を判別してデフォルト選択
            const defaultCamera = cameras.find(camera => {
              const label = camera.label.toLowerCase();
              // モバイルデバイスの環境カメラを優先
              return label.includes('back') || 
                     label.includes('rear') || 
                     label.includes('environment') ||
                     label.includes('背面') ||
                     label.includes('外側');
            }) || cameras[0]; // 見つからない場合は最初のカメラ

            setSelectedCamera(defaultCamera.deviceId)
            setFacingMode('environment') // デフォルトは背面カメラ
          }
        }
      } catch (err) {
        console.error('Error listing cameras:', err)
        if (mounted) {
          setError('カメラの一覧取得に失敗しました。カメラへのアクセスを許可してください。')
        }
      }
    }

    updateCameraList()
    // デバイスの変更を監視
    navigator.mediaDevices.addEventListener('devicechange', updateCameraList)

    return () => {
      mounted = false
      navigator.mediaDevices.removeEventListener('devicechange', updateCameraList)
    }
  }, [])

  useEffect(() => {
    if (selectedCamera) {
      initializeCamera()
    }
  }, [selectedCamera, facingMode])

  const initializeCamera = async () => {
    try {
      // 既存のストリームを停止
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }

      // カメラの制約を設定
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: !selectedCamera ? facingMode : undefined, // デバイスIDが指定されていない場合のみfacingModeを使用
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      }

      // ストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            // ビデオのアスペクト比を維持しながらCanvasのサイズを設定
            const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
          }
        }
        
        setHasCamera(true)
        setError('')

        // デバイス情報をログに出力
        const videoTrack = stream.getVideoTracks()[0]
        console.log('Using camera:', videoTrack.label)
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

  const toggleCamera = async () => {
    if (availableCameras.length < 2) {
      setError('切り替え可能なカメラがありません')
      return
    }

    // 現在のカメラのインデックスを取得
    const currentIndex = availableCameras.findIndex(camera => camera.deviceId === selectedCamera)
    // 次のカメラを選択（最後のカメラの場合は最初に戻る）
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]

    // カメラの種類を判別してfacingModeを更新
    const label = nextCamera.label.toLowerCase()
    const isBackCamera = label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('背面') || label.includes('外側')
    setFacingMode(isBackCamera ? 'environment' : 'user')
    setSelectedCamera(nextCamera.deviceId)
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

  useEffect(() => {
    let animationFrameId: number

    const drawVideoToCanvas = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // ビデオフレームをcanvasに描画
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
            <option value="">カメラを選択</option>
            {availableCameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `カメラ ${camera.deviceId.slice(0, 4)}`}
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
            onClick={() => {
              navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                  const cameras = devices
                    .filter(device => device.kind === 'videoinput')
                    .map(device => ({
                      deviceId: device.deviceId,
                      label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
                      kind: device.kind as 'videoinput'
                    }))
                  setAvailableCameras(cameras)
                })
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            更新
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
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/30">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleCamera}
                  disabled={availableCameras.length < 2}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-brand-primary/80 rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
                  </svg>
                  <span>カメラ切替</span>
                </button>
              </div>
              <div className="text-xs text-white/80">
                {availableCameras.find(camera => camera.deviceId === selectedCamera)?.label || 'カメラ未選択'}
              </div>
            </div>
            
            {error && (
              <div className="px-3 py-2 rounded bg-red-500/20 border border-red-500/30">
                <p className="text-xs text-white/90">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* カメラ選択ドロップダウン */}
      <div className="mt-4">
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white/90 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="">カメラを選択...</option>
          {availableCameras.map(camera => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `カメラ ${camera.deviceId.slice(0, 4)}`}
            </option>
          ))}
        </select>
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
