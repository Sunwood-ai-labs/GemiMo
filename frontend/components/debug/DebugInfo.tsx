import { AnalysisResult } from '@/lib/types/camera'
import { getStateColor, getObjectColor } from '@/lib/utils/drawing'

interface DebugInfoProps {
  analysis: AnalysisResult | null
}

export const DebugInfo = ({ analysis }: DebugInfoProps) => {
  return (
    <div className="space-y-2 text-sm font-mono">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-gray-500">State:</span>
          <span className="ml-2" style={{ color: getStateColor(analysis?.state || 'UNKNOWN') }}>
            {analysis?.state || 'UNKNOWN'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Confidence:</span>
          <span className="ml-2">
            {analysis?.confidence ? (analysis.confidence * 100).toFixed(1) + '%' : 'N/A'}
          </span>
        </div>
        {analysis?.alarm && (
          <>
            <div>
              <span className="text-gray-500">Volume:</span>
              <span className="ml-2">{(analysis.alarm.volume * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Frequency:</span>
              <span className="ml-2">{analysis.alarm.frequency}Hz</span>
            </div>
          </>
        )}
      </div>
      
      {/* Object List */}
      {analysis?.boxes && Object.keys(analysis.boxes).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Detected Objects:</h4>
          <div className="space-y-1">
            {Object.entries(analysis.boxes).map(([label, box]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getObjectColor(label) }} />
                <span>{label}</span>
                <span className="text-gray-500">({Math.round(box.confidence * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}