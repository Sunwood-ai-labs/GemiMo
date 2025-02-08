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

  // Add video metadata loaded handler
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleMetadata = () => {
      const inputCanvas = inputCanvasRef.current
      const vizCanvas = vizCanvasRef.current
      if (!inputCanvas || !vizCanvas) return

      // Set canvas dimensions
      const videoWidth = video.videoWidth || 640
      const videoHeight = video.videoHeight || 480
      inputCanvas.width = videoWidth
      inputCanvas.height = videoHeight
      vizCanvas.width = videoWidth
      vizCanvas.height = videoHeight
    }

    video.addEventListener('loadedmetadata', handleMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata)
    }
  }, [videoRef])

  const updateCanvases = () => {
    const video = videoRef.current
    const inputCanvas = inputCanvasRef.current
    const vizCanvas = vizCanvasRef.current
    if (!video || !inputCanvas || !vizCanvas) return

    // Get canvas contexts
    const inputCtx = inputCanvas.getContext('2d')
    const vizCtx = vizCanvas.getContext('2d')
    if (!inputCtx || !vizCtx) return

    // Update canvases only if video is playing
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Draw input frame
      inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height)
      inputCtx.drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height)

      // Draw visualization frame
      vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height)
      vizCtx.drawImage(video, 0, 0, vizCanvas.width, vizCanvas.height)

      // Draw analysis results if available
      if (analysis?.boxes) {
        Object.entries(analysis.boxes).forEach(([label, box]) => {
          drawBox3D(vizCtx, label, box, vizCanvas.width, vizCanvas.height)
        })
        drawDebugInfo(vizCtx, analysis)
      }
    }
  }

  useEffect(() => {
    let animationFrameId: number

    const animate = () => {
      updateCanvases()
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
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
