import { Box3D, AnalysisResult } from '../types/camera'

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
  box: number[],
  width: number,
  height: number
) => {
  // デフォルト値を設定
  const [x, y, z, w, h, d, roll, pitch, yaw, confidence = 0] = box
  
  // Convert normalized coordinates to screen coordinates
  const screenX = width * x
  const screenY = height * y
  
  // より大きなスケール係数を使用
  const scale = Math.max(0.3, 1 - z * 0.8)
  
  ctx.save()
  
  // Transform to object position
  ctx.translate(screenX, screenY)
  ctx.rotate((yaw * Math.PI) / 180)
  
  // Draw box with larger dimensions
  const boxWidth = w * width * scale * 1.2
  const boxHeight = h * height * scale * 1.2
  
  // Box style with thicker lines
  const color = getObjectColor(label)
  ctx.strokeStyle = color
  ctx.fillStyle = `${color}33`
  ctx.lineWidth = 3
  
  // Draw main rectangle
  ctx.beginPath()
  ctx.rect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
  ctx.fill()
  ctx.stroke()
  
  // Draw 3D perspective lines with dashed style
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
  ctx.font = '16px monospace'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  const labelText = `${label} (${Math.round(confidence * 100)}%)`
  const textWidth = ctx.measureText(labelText).width
  ctx.fillRect(-textWidth / 2 - 5, -boxHeight / 2 - 25, textWidth + 10, 25)
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(labelText, 0, -boxHeight / 2 - 5)
  
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

export const drawDebugInfo = (ctx: CanvasRenderingContext2D, data: AnalysisResult) => {
  const padding = 10
  const lineHeight = 20
  let y = padding + lineHeight

  // Set text style
  ctx.font = '14px monospace'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, 200, 120)
  ctx.fillStyle = 'white'

  // Draw state and confidence
  if (data.state) {
    ctx.fillText(`State: ${data.state}`, padding, y)
    y += lineHeight
  }

  if (data.confidence !== undefined) {
    ctx.fillText(`Conf: ${(data.confidence * 100).toFixed(1)}%`, padding, y)
    y += lineHeight
  }

  // Draw alarm parameters
  if (data.alarm) {
    ctx.fillText(`Vol: ${(data.alarm.volume * 100).toFixed(1)}%`, padding, y)
    y += lineHeight
    ctx.fillText(`Freq: ${data.alarm.frequency}Hz`, padding, y)
  }
}
