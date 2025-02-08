import { Box3D, AnalysisResult } from '@/lib/types/camera'

export const getObjectColor = (label: string): string => {
  const colors: { [key: string]: string } = {
    keyboard: '#00FF00', // Green
    mouse: '#FF0000',    // Red
    'stuffed animal': '#4169E1', // Royal Blue
    person: '#FFA500',   // Orange
    default: '#FFFFFF'   // White
  }
  return colors[label.toLowerCase()] || colors.default
}

export const drawBox3D = (
  ctx: CanvasRenderingContext2D,
  label: string,
  box: Box3D,
  width: number,
  height: number
) => {
  const { position, dimensions, rotation, confidence } = box
  const [x, y, z] = position
  const [w, h, d] = dimensions
  const [roll, pitch, yaw] = rotation
  
  // Convert normalized coordinates to screen coordinates
  const screenX = width * x
  const screenY = height * y
  
  // Scale based on Z position (perspective effect)
  const scale = Math.max(0.2, 1 - z)
  
  ctx.save()
  
  // Transform to object position
  ctx.translate(screenX, screenY)
  ctx.rotate((yaw * Math.PI) / 180)
  
  // Draw box
  const boxWidth = w * width * scale
  const boxHeight = h * height * scale
  
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
  const depthScale = d * 50 * scale
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
  
  // Draw label with confidence
  ctx.font = '12px monospace'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  const labelText = `${label} (${Math.round(confidence * 100)}%)`
  const textWidth = ctx.measureText(labelText).width
  ctx.fillRect(-textWidth / 2 - 5, -boxHeight / 2 - 20, textWidth + 10, 20)
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(labelText, 0, -boxHeight / 2 - 5)
  
  ctx.restore()
}

export const drawDebugInfo = (ctx: CanvasRenderingContext2D, data: AnalysisResult) => {
  ctx.save()
  
  // Background for debug info
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(10, 10, 300, 180)
  
  // Text settings
  ctx.font = '14px monospace'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'
  
  // Draw debug information
  const lines = [
    `State: ${data.state || 'UNKNOWN'} (${Math.round((data.confidence || 0) * 100)}%)`,
    'Objects:',
    ...Object.entries(data.boxes || {}).map(([label, box]) => 
      `  - ${label}: ${Math.round(box.confidence * 100)}%`
    ),
    '',
    'Alarm:',
    data.alarm ? 
      `  Vol: ${Math.round(data.alarm.volume * 100)}%, Freq: ${data.alarm.frequency}Hz` :
      '  Inactive'
  ]
  
  lines.forEach((line, i) => {
    ctx.fillText(line, 20, 35 + i * 20)
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
