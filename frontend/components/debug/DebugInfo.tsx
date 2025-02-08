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

  const formatNumber = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  return (
    <div className="w-full p-12 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold mb-12 text-gray-800">Analysis Results</h2>
      
      <div className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* State */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">State</div>
            <div className="font-semibold" style={{ color: getStateColor(analysis?.state || 'UNKNOWN') }}>
              {analysis?.state || 'UNKNOWN'}
            </div>
          </div>

          {/* Confidence */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Confidence</div>
            <div className="font-semibold">
              {analysis?.confidence ? formatNumber(analysis.confidence) : 'N/A'}
            </div>
          </div>

          {/* Position */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Position</div>
            <div className="font-mono text-sm">
              {formatPosition(analysis?.position)}
            </div>
          </div>

          {/* Rotation */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Rotation</div>
            <div className="font-mono text-sm">
              {formatOrientation(analysis?.orientation)}
            </div>
          </div>

          {/* Alarm Volume */}
          {analysis?.alarm && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Volume</div>
                <div className="font-semibold">
                  {formatNumber(analysis.alarm.volume)}
                </div>
              </div>

              {/* Frequency */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Frequency</div>
                <div className="font-semibold">
                  {analysis.alarm.frequency}Hz
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detected Objects Table */}
        {analysis?.boxes && Object.keys(analysis.boxes).length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">検出オブジェクト</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      オブジェクト
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      信頼度
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      位置 (x, y, z)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      サイズ (w, h, d)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回転 (x°, y°, z°)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analysis.boxes).map(([label, box], index) => (
                    <tr 
                      key={label}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getObjectColor(label) }} 
                          />
                          <span className="font-medium text-gray-900">{label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatNumber(box.confidence)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                        {formatPosition(box.position)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                        {formatPosition(box.dimensions)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                        {formatOrientation(box.rotation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {analysis?.timestamp && (
          <div className="text-xs text-gray-500 mt-4">
            Timestamp: {new Date(analysis.timestamp * 1000).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
