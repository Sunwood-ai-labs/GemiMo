import React, { RefObject } from 'react'

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement>
  facingMode: 'user' | 'environment'
  isAnalyzing: boolean
  processingStatus: string
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  facingMode,
  isAnalyzing,
  processingStatus
}) => {
  return (
    <div className="relative aspect-video bg-gradient-to-b from-brand-primary/5 to-brand-accent/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {isAnalyzing && processingStatus && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          {processingStatus}
        </div>
      )}
    </div>
  )
}
