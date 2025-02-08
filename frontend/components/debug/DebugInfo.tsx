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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-gray-500">状態:</span>
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

        <div>
          <span className="text-gray-500">Position:</span>
          <span className="ml-2">{formatPosition(analysis?.position)}</span>
        </div>
        <div>
          <span className="text-gray-500">Rotation:</span>
          <span className="ml-2">{formatOrientation(analysis?.orientation)}</span>
        </div>

        {analysis?.alarm && (
          <>
            <div>
              <span className="text-gray-500">Volume:</span>
              <span className="ml-2">{(analysis.alarm.volume * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Frequency:</span>
              <span className="ml-2">{analysis.alarm.frequency}Hz</span>
            </div>
          </>
        )}
      </div>
      
      {analysis?.boxes && Object.keys(analysis.boxes).length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">検出オブジェクト:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">オブジェクト</th>
                  <th className="px-2 py-1 text-left">信頼度</th>
                  <th className="px-2 py-1 text-left">位置 (x, y, z)</th>
                  <th className="px-2 py-1 text-left">サイズ (w, h, d)</th>
                  <th className="px-2 py-1 text-left">回転 (x°, y°, z°)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analysis.boxes).map(([label, box]) => (
                  <tr 
                    key={label} 
                    className="border-t border-gray-200"
                  >
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getObjectColor(label) }} 
                        />
                        <span className="font-medium">{label}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      {box[9] ? `${(box[9] * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-2 py-1">
                      ({box[0].toFixed(3)}, {box[1].toFixed(3)}, {box[2].toFixed(3)})
                    </td>
                    <td className="px-2 py-1">
                      ({box[3].toFixed(3)}, {box[4].toFixed(3)}, {box[5].toFixed(3)})
                    </td>
                    <td className="px-2 py-1">
                      ({box[6].toFixed(1)}°, {box[7].toFixed(1)}°, {box[8].toFixed(1)}°)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analysis?.timestamp && (
        <div className="text-xs text-gray-500 mt-2">
          Timestamp: {new Date(analysis.timestamp * 1000).toLocaleString()}
        </div>
      )}
    </div>
  )
}
