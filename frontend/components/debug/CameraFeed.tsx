import { useEffect, useRef, useState } from 'react'
import { CameraControls } from './camera/CameraControls'
import { CameraPreview } from './camera/CameraPreview'
import { AnalysisPanel } from './analysis/AnalysisPanel'
import { DebugView } from './debug/DebugView'
import { AnalysisResult } from '@/lib/types/camera'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'

export const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  const cameraProps = useCameraDevices()

  useEffect(() => {
    if (cameraProps.selectedCamera) {
      cameraProps.initializeCamera(videoRef)
    }
  }, [cameraProps.selectedCamera, cameraProps.facingMode, cameraProps.selectedResolution])

  return (
    <div className="w-full mx-auto">
      <CameraControls {...cameraProps} />
      
      <CameraPreview 
        videoRef={videoRef}
        facingMode={cameraProps.facingMode}
        isAnalyzing={isAnalyzing}
        processingStatus={processingStatus}
      />

      <AnalysisPanel 
        analysis={analysis}
        capturedImage={capturedImage}
      />

      <DebugView 
        analysis={analysis}
        capturedImage={capturedImage}
      />
    </div>
  )
}
