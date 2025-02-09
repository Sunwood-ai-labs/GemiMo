interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>
  facingMode: 'user' | 'environment'
  isAnalyzing: boolean
  processingStatus: string
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  facingMode,
  isAnalyzing,
  processingStatus,
}) => {
  return (
    <div className="relative aspect-video bg-gradient-to-b from-brand-primary/5 to-brand-accent/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
      />
      
      {(isAnalyzing || processingStatus) && (
        <div className="absolute inset-x-0 bottom-20 flex justify-center">
          <div className="px-4 py-2 rounded-full bg-black/50 text-white text-sm">
            {processingStatus || 'Analyzing...'}
          </div>
        </div>
      )}
    </div>
  )
}
