import { useEffect, useRef, useState } from 'react'
import { SleepData } from '@/lib/types'

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [sleepData, setSleepData] = useState<SleepData | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [hasCamera, setHasCamera] = useState(false)

  useEffect(() => {
    initializeCamera()
    return () => {
      // Cleanup camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setHasCamera(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setHasCamera(false)
    }
  }

  useEffect(() => {
    if (!hasCamera) return
    
    const websocket = new WebSocket('ws://localhost:8000/ws/gemimo')
    setWs(websocket)

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setSleepData(data)
      setAnalysis(data)
      updateCanvas(data)
    }

    // Start sending frames when websocket is ready
    websocket.onopen = () => {
      startSendingFrames(websocket)
    }

    return () => {
      websocket.close()
    }
  }, [hasCamera])

  const startSendingFrames = (websocket: WebSocket) => {
    const sendFrame = () => {
      if (!videoRef.current || !canvasRef.current || websocket.readyState !== WebSocket.OPEN) return

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return

      // Draw the current video frame to the canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      // Convert the canvas to a blob and send it through websocket
      canvas.toBlob((blob) => {
        if (blob && websocket.readyState === WebSocket.OPEN) {
          websocket.send(blob)
        }
      }, 'image/jpeg', 0.8)
    }

    // Send frames every 100ms (10fps)
    const intervalId = setInterval(sendFrame, 100)
    return () => clearInterval(intervalId)
  }

  const updateCanvas = (data: SleepData) => {
    const canvas = canvasRef.current
    if (!canvas || !data.boxes) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw 3D bounding boxes
    Object.entries(data.boxes).forEach(([label, box]) => {
      const [x, y, z, width, height, depth, roll, pitch, yaw] = box
      ctx.strokeStyle = label === 'person' ? '#00ff00' : '#0000ff'
      ctx.lineWidth = 2
      draw3DBox(ctx, x, y, width, height, pitch)
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
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-brand-primary/5 to-brand-accent/5 backdrop-blur-sm border border-white/10">
        {/* Hidden video element to get camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        
        {/* Canvas for displaying camera feed and analysis */}
        <canvas 
          ref={canvasRef} 
          width={640}
          height={480}
          className="w-full aspect-video object-cover"
        />

        {analysis && (
          <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-black/10">
            <div className="flex items-center justify-between text-gray-800">
              <div className="space-y-1">
                <h3 className="font-medium">Sleep State</h3>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-sm font-medium">{analysis.sleepState}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Last Updated</p>
                <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
          <h3 className="text-gray-800 font-medium mb-2">Motion Analysis</h3>
          <div className="space-y-2">
            {analysis?.motionData?.map((data: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-primary rounded-full transition-all"
                      style={{ width: `${data.value * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500">
                    {data.value.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
          <h3 className="text-gray-800 font-medium mb-2">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm text-gray-600">Camera Connected</span>
              </div>
              <span className="text-xs text-gray-500">Ready</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm text-gray-600">AI Analysis</span>
              </div>
              <span className="text-xs text-gray-500">Processing</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-brand-accent" />
                <span className="text-sm text-gray-600">Signal Strength</span>
              </div>
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-brand-accent' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
