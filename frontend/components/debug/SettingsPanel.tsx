import { useState } from 'react'

const MODEL_OPTIONS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-pro-preview-02-05"
] as const

type ModelId = typeof MODEL_OPTIONS[number]

interface SettingsPanelProps {
  onModelChange: (modelId: ModelId) => void
  currentModel: ModelId
}

export const SettingsPanel = ({ onModelChange, currentModel }: SettingsPanelProps) => {
  return (
    <div className="p-4 rounded-lg backdrop-blur-sm bg-white/90 border border-white/10">
      <h3 className="text-gray-800 font-medium mb-4">Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-600 mb-2">
            LLM Model
          </label>
          <select
            id="model-select"
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value as ModelId)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          >
            {MODEL_OPTIONS.map((modelId) => (
              <option key={modelId} value={modelId}>
                {modelId}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
