import React from 'react';
import { SleepState } from '../../lib/types';

interface ProgressBarProps {
  progress: number;
  state: SleepState;
  isAnalyzing: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, state, isAnalyzing }) => {
  const getStateColor = (currentState: SleepState): string => {
    const colors: Record<SleepState, string> = {
      'SLEEPING': '#4CAF50',
      'STRUGGLING': '#FFC107',
      'AWAKE': '#2196F3',
      'UNKNOWN': '#9E9E9E'
    };
    return colors[currentState] || colors['UNKNOWN'];
  };

  return (
    <div className="w-full">
      {/* プログレスバーのラベル */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {isAnalyzing ? '解析中...' : '解析状態'}
        </span>
        <span className="text-sm font-medium" style={{ color: getStateColor(state) }}>
          {state}
        </span>
      </div>

      {/* プログレスバー */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-in-out"
          style={{
            width: `${progress}%`,
            backgroundColor: getStateColor(state)
          }}
        />
      </div>

      {/* 進捗率 */}
      <div className="mt-1 text-right">
        <span className="text-xs text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};
