import { useState, useRef, useEffect } from 'react'
import { AnalysisResult } from '@/lib/types/camera'
import { drawBox3D, drawDebugInfo, getStateColor } from '@/lib/utils/drawing'
import { useCameraDevices } from '@/lib/hooks/useCameraDevices'
import { DebugCanvas } from './DebugCanvas'
import { DebugInfo } from './DebugInfo'
import { AnalysisPanel } from './analysis/AnalysisPanel'
import { CameraControls } from './camera/CameraControls'
import { CameraPreview } from './camera/CameraPreview'

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
      <CameraControls 
        selectedCamera={cameraProps.selectedCamera}
        setSelectedCamera={cameraProps.setSelectedCamera}
        toggleCamera={cameraProps.toggleCamera}
        error={cameraProps.error}
        availableCameras={cameraProps.availableCameras}
        selectedResolution={cameraProps.selectedResolution}
      />

      <CameraPreview
        videoRef={videoRef}
        facingMode={cameraProps.facingMode}
        isAnalyzing={isAnalyzing}
        processingStatus={processingStatus}
      />

      <AnalysisPanel analysis={analysis} />

      <div className="mt-8 p-6 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Debug View</h3>
        <div className="space-y-6">
          <DebugCanvas 
            videoRef={videoRef}
            analysis={analysis}
            facingMode={cameraProps.facingMode}
            capturedImage={capturedImage}
          />
          <DebugInfo analysis={analysis} />
        </div>
      </div>
    </div>
  )
}
