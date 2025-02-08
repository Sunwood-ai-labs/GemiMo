import { AnalysisResult } from '../../lib/types/camera'
import { getStateColor, getObjectColor } from '../../lib/utils/drawing'

interface DebugInfoProps {
  analysis: AnalysisResult | null
}

export const DebugInfo = ({ analysis }: DebugInfoProps) => {
  const formatPosition = (pos?: [number, number, number]) => {
    if (!pos) return 'N/A';
    return `(${pos.map(v => v.toFixed(3)).join(', ')})`;
  };

  const formatOrientation = (rot?: [number, number, number]) => {
    if (!rot) return 'N/A';
    return `(${rot.map(v => `${v.toFixed(1)}°`).join(', ')})`;
  };

  return (
    <div className="space-y-4 text-sm font-mono">
      {/* State and Confidence */}
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

        {/* Position and Orientation */}
        <div>
          <span className="text-gray-500">Position:</span>
          <span className="ml-2">{formatPosition(analysis?.position)}</span>
        </div>
        <div>
          <span className="text-gray-500">Rotation:</span>
          <span className="ml-2">{formatOrientation(analysis?.orientation)}</span>
        </div>

        {/* Alarm Parameters */}
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
      
      {/* Detected Objects with 3D Box Info */}
      {analysis?.boxes && Object.keys(analysis.boxes).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Detected Objects:</h4>
          <div className="space-y-3">
            {Object.entries(analysis.boxes).map(([label, box]) => (
              <div key={label} className="border-l-2 pl-3" style={{ borderColor: getObjectColor(label) }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getObjectColor(label) }} />
                  <span className="font-medium">{label}</span>
                  <span className="text-gray-500">({Math.round(box.confidence * 100)}%)</span>
                </div>
                <div className="mt-1 text-xs space-y-1 text-gray-600">
                  <div>Position: {formatPosition(box.position)}</div>
                  <div>Dimensions: {formatPosition(box.dimensions)}</div>
                  <div>Rotation: {formatOrientation(box.rotation)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {analysis?.timestamp && (
        <div className="text-xs text-gray-500 mt-2">
          Timestamp: {new Date(analysis.timestamp * 1000).toLocaleString()}
        </div>
      )}
    </div>
  )
}
