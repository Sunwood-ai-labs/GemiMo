import React from 'react'
import { AnalysisResult } from '@/lib/types/camera'

interface AnalysisPanelProps {
  analysis: AnalysisResult | null
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="p-4 text-gray-500 bg-white/10 backdrop-blur-sm rounded-lg">
        解析結果を待機中...
      </div>
    )
  }

  const getStateColor = (state: string) => {
    const colors = {
      SLEEPING: 'text-green-500',
      STRUGGLING: 'text-yellow-500',
      AWAKE: 'text-blue-500',
      UNKNOWN: 'text-gray-500'
    }
    return colors[state as keyof typeof colors] || colors.UNKNOWN
  }

  return (
    <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg space-y-4">
      <h3 className="text-lg font-medium text-gray-800">解析結果</h3>

      <div className="space-y-2">
        {/* 状態 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">状態:</span>
          <span className={`font-medium ${getStateColor(analysis.state || 'UNKNOWN')}`}>
            {analysis.state || 'UNKNOWN'}
          </span>
        </div>

        {/* 信頼度 */}
        {analysis.confidence !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">信頼度:</span>
            <span className="font-medium">
              {(analysis.confidence * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* アラーム情報 */}
        {analysis.alarm && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">音量:</span>
              <span className="font-medium">
                {(analysis.alarm.volume * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">周波数:</span>
              <span className="font-medium">
                {analysis.alarm.frequency}Hz
              </span>
            </div>
          </>
        )}

        {/* 検出オブジェクト */}
        {analysis.boxes && Object.keys(analysis.boxes).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">検出オブジェクト:</h4>
            <div className="space-y-1">
              {Object.entries(analysis.boxes).map(([label, box]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">
                    {box[9] ? `${(box[9] * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}