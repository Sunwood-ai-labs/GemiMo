import { useEffect, useRef, useState } from 'react'
import { SleepData } from '@/lib/types'

export const CameraFeed = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [sleepData, setSleepData] = useState<SleepData | null>(null)

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000/ws/gemimo')
    setWs(websocket)

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setSleepData(data)
      updateCanvas(data)
    }

    return () => {
      websocket.close()
    }
  }, [])

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
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-auto"
      />
      {sleepData && (
        <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded">
          <div>State: {sleepData.state}</div>
          <div>Confidence: {(sleepData.confidence * 100).toFixed(1)}%</div>
          <div>
            Alarm: {(sleepData.alarm.volume * 100).toFixed(1)}% @
            {sleepData.alarm.frequency}Hz
          </div>
        </div>
      )}
    </div>
  )
}
