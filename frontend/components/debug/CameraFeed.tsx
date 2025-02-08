import { useEffect, useRef, useState } from 'react'
import { useWebSocket } from '@/lib/hooks/useWebSocket'
import { SleepData } from '@/lib/types'

export const CameraFeed = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ws = useWebSocket('ws://localhost:8000/ws/gemimo')
  const [sleepData, setSleepData] = useState<SleepData | null>(null)
  
  useEffect(() => {
    if (!ws) return
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setSleepData(data)
      updateCanvas(data)
    }
  }, [ws])
  
  const updateCanvas = (data: SleepData) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 状態に応じた表示更新
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawSleepState(ctx, data)
  }
  
  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-64" />
      {sleepData && (
        <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded">
          <p>State: {sleepData.state}</p>
          <p>Confidence: {sleepData.confidence.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}
