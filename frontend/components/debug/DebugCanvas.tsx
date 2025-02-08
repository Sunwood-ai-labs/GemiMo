import { useEffect, useRef } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { drawBox3D, drawDebugInfo } from '@/lib/utils/drawing'

interface DebugCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>
  analysis: AnalysisResult | null
  facingMode: 'user' | 'environment'
}

export const DebugCanvas = ({ videoRef, analysis, facingMode }: DebugCanvasProps) => {
  const inputCanvasRef = useRef<HTMLCanvasElement>(null)
  const vizCanvasRef = useRef<HTMLCanvasElement>(null)

  const updateCanvases = () => {
    const video = videoRef.current
    const inputCanvas = inputCanvasRef.current
    const vizCanvas = vizCanvasRef.current
    if (!video || !inputCanvas || !vizCanvas || !analysis) return

    // Set canvas dimensions
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    inputCanvas.width = width
    inputCanvas.height = height
    vizCanvas.width = width
    vizCanvas.height = height

    // Get canvas contexts
    const inputCtx = inputCanvas.getContext('2d')
    const vizCtx = vizCanvas.getContext('2d')
    if (!inputCtx || !vizCtx) return

    // Draw input frame
    inputCtx.clearRect(0, 0, width, height)
    inputCtx.drawImage(video, 0, 0, width, height)

    // Draw visualization frame
    vizCtx.clearRect(0, 0, width, height)
    vizCtx.drawImage(video, 0, 0, width, height)

    // Draw detected objects and debug info
    if (analysis.boxes) {
      Object.entries(analysis.boxes).forEach(([label, box]) => {
        drawBox3D(vizCtx, label, box, width, height)
      })
    }
    drawDebugInfo(vizCtx, analysis)
  }

  useEffect(() => {
    if (analysis) {
      updateCanvases()
    }
  }, [analysis, videoRef])

  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Input Image */}
      <div className="relative aspect-video group">
        <canvas 
          ref={inputCanvasRef}
          className="absolute inset-0 w-full h-full object-contain bg-black/10 rounded-lg transition-transform duration-300 group-hover:scale-150 group-hover:z-10"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <div className="absolute top-2 left-2 text-xs font-mono text-white bg-black/50 px-2 py-1 rounded">
          Input
        </div>
      </div>
      
      {/* Visualization */}
      <div className="relative aspect-video group">
        <canvas 
          ref={vizCanvasRef}
          className="absolute inset-0 w-full h-full object-contain bg-black/10 rounded-lg transition-transform duration-300 group-hover:scale-150 group-hover:z-10"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <div className="absolute top-2 left-2 text-xs font-mono text-white bg-black/50 px-2 py-1 rounded">
          Visualization
        </div>
      </div>
    </div>
  )
}