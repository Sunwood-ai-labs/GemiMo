import { useEffect, useRef } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { drawBox3D } from '@/lib/utils/drawing'

interface DebugCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>
  analysis: AnalysisResult | null
  facingMode: 'user' | 'environment'
  capturedImage: string | null
}

export const DebugCanvas = ({ videoRef, analysis, facingMode, capturedImage }: DebugCanvasProps) => {
  const inputCanvasRef = useRef<HTMLCanvasElement>(null)
  const vizCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!capturedImage) return

    const inputCanvas = inputCanvasRef.current
    const vizCanvas = vizCanvasRef.current
    if (!inputCanvas || !vizCanvas) return

    const img = new Image()
    img.onload = () => {
      // コンテナの幅を取得（パディングを考慮）
      const containerWidth = Math.min(
        window.innerWidth - 64,
        1920
      )
      const targetWidth = (containerWidth / 2) - 16
      
      // 画像のアスペクト比を維持しながらキャンバスサイズを計算
      const aspectRatio = img.height / img.width
      const canvasWidth = targetWidth
      const canvasHeight = targetWidth * aspectRatio

      // 入力画像用キャンバス
      inputCanvas.width = canvasWidth
      inputCanvas.height = canvasHeight
      const inputCtx = inputCanvas.getContext('2d')
      if (inputCtx) {
        // そのまま描画
        inputCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      }

      // 可視化用キャンバス
      vizCanvas.width = canvasWidth
      vizCanvas.height = canvasHeight
      const vizCtx = vizCanvas.getContext('2d')
      if (vizCtx) {
        // そのまま描画
        vizCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        
        // 解析結果の描画
        if (analysis?.boxes) {
          Object.entries(analysis.boxes).forEach(([label, box]) => {
            drawBox3D(vizCtx, label, box, canvasWidth, canvasHeight)
          })
        }
      }
    }
    img.src = capturedImage

    // ウィンドウリサイズ時にキャンバスサイズを再計算
    const handleResize = () => {
      if (img.complete && typeof img.onload === 'function') {
        img.onload.call(img, new Event('load'))
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)

  }, [capturedImage, analysis, facingMode])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Input Image */}
      <div className="relative aspect-[4/3] w-full">
        <canvas 
          ref={inputCanvasRef}
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Visualization */}
      <div className="relative aspect-[4/3] w-full">
        <canvas 
          ref={vizCanvasRef}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  )
}
