import { Box3D, AnalysisResult } from '@/lib/types/camera'

export const getObjectColor = (label: string): string => {
  const colors: { [key: string]: string } = {
    keyboard: '#00ff00',
    mouse: '#ff0000',
    'stuffed animal': '#0000ff',
    default: '#ffffff'
  }
  return colors[label] || colors.default
}

export const drawBox3D = (
  ctx: CanvasRenderingContext2D,
  label: string,
  box: Box3D,
  width: number,
  height: number
) => {
  const { position, dimensions, rotation } = box
  const [x, y, z] = position
  const [w, h, d] = dimensions
  const [roll, pitch, yaw] = rotation
  
  // Convert normalized coordinates to screen coordinates
  const screenX = width * (0.5 + x)
  const screenY = height * (0.5 + y)
  
  // Scale based on Z position (perspective effect)
  const scale = 200 * (1 - z * 0.5)
  
  ctx.save()
  
  // Transform to object position
  ctx.translate(screenX, screenY)
  ctx.rotate((yaw * Math.PI) / 180)
  
  // Draw box
  const boxWidth = w * scale
  const boxHeight = h * scale
  
  // Box style
  const color = getObjectColor(label)
  ctx.strokeStyle = color
  ctx.fillStyle = `${color}33` // 20% opacity
  ctx.lineWidth = 2
  
  // Draw main rectangle
  ctx.beginPath()
  ctx.rect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
  ctx.fill()
  ctx.stroke()
  
  // Draw 3D perspective lines
  const depthScale = d * 50 // Scale depth lines
  ctx.beginPath()
  ctx.setLineDash([5, 5])
  ctx.moveTo(-boxWidth / 2, -boxHeight / 2)
  ctx.lineTo(-boxWidth / 2 - depthScale, -boxHeight / 2 - depthScale)
  ctx.moveTo(boxWidth / 2, -boxHeight / 2)
  ctx.lineTo(boxWidth / 2 - depthScale, -boxHeight / 2 - depthScale)
  ctx.moveTo(-boxWidth / 2, boxHeight / 2)
  ctx.lineTo(-boxWidth / 2 - depthScale, boxHeight / 2 - depthScale)
  ctx.moveTo(boxWidth / 2, boxHeight / 2)
  ctx.lineTo(boxWidth / 2 - depthScale, boxHeight / 2 - depthScale)
  ctx.stroke()
  ctx.setLineDash([])
  
  // Draw label
  ctx.font = '14px monospace'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(-boxWidth / 2, -boxHeight / 2 - 20, boxWidth, 20)
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(`${label} (${Math.round(box.confidence * 100)}%)`, 0, -boxHeight / 2 - 5)
  
  ctx.restore()
}

export const drawDebugInfo = (ctx: CanvasRenderingContext2D, data: AnalysisResult) => {
  ctx.save()
  
  // Background for debug info
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(10, 10, 300, 160)
  
  // Text settings
  ctx.font = '14px monospace'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'
  
  // Draw debug information
  const lines = [
    `Objects: ${Object.keys(data.boxes || {}).length}`,
    `State: ${data.state || 'UNKNOWN'}`,
    `Confidence: ${data.confidence ? (data.confidence * 100).toFixed(1) + '%' : 'N/A'}`,
    `Position: [${data.position?.map(v => v.toFixed(2)).join(', ') || 'N/A'}]`,
    `Orientation: [${data.orientation?.map(v => v.toFixed(0) + '°').join(', ') || 'N/A'}]`,
    `Alarm: ${data.alarm ? `Vol: ${(data.alarm.volume * 100).toFixed(0)}%, Freq: ${data.alarm.frequency}Hz` : 'N/A'}`
  ]
  
  lines.forEach((line, i) => {
    ctx.fillText(line, 20, 35 + i * 25)
  })
  
  ctx.restore()
}

export const getStateColor = (state: string): string => {
  const colors = {
    SLEEPING: '#4CAF50',
    STRUGGLING: '#FFC107',
    AWAKE: '#2196F3',
    UNKNOWN: '#9E9E9E'
  }
  return colors[state as keyof typeof colors] || colors.UNKNOWN
}
