import React from 'react'
import { AnalysisResult } from '@/lib/types/camera'

interface AnalysisPanelProps {
  analysis: AnalysisResult | null
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="p-4 text-gray-500 bg-white/10 backdrop-blur-sm rounded-lg">
        <p>No analysis data available</p>
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
      <h3 className="text-lg font-display text-gray-800">Analysis Results</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">State</p>
          <p className={`font-medium ${getStateColor(analysis.state || 'UNKNOWN')}`}>
            {analysis.state || 'UNKNOWN'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="font-medium text-gray-800">
            {analysis.confidence ? `${(analysis.confidence * 100).toFixed(1)}%` : 'N/A'}
          </p>
        </div>

        {analysis.alarm && (
          <>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Volume</p>
              <p className="font-medium text-gray-800">
                {(analysis.alarm.volume * 100).toFixed(1)}%
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Frequency</p>
              <p className="font-medium text-gray-800">
                {analysis.alarm.frequency}Hz
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
