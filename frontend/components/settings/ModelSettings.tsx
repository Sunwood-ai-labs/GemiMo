const MODEL_OPTIONS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-pro-preview-02-05"
] as const

interface ModelSettingsProps {
  model: string
  onModelChange: (model: string) => void
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({ model, onModelChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Gemini Model
      </label>
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      >
        {MODEL_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Select the Gemini model to use for analysis
      </p>
    </div>
  )
}
