const MODEL_OPTIONS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-pro-preview-02-05"
] as const

interface ModelSettingsProps {
  selectedModel: typeof MODEL_OPTIONS[number]
  onModelChange: (model: typeof MODEL_OPTIONS[number]) => void
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({
  selectedModel,
  onModelChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display text-gray-800">Model Settings</h3>
      <div className="space-y-2">
        <label htmlFor="model" className="block text-sm font-medium text-gray-600">
          Gemini Model
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as typeof MODEL_OPTIONS[number])}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {MODEL_OPTIONS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
