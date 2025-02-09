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
      <h3 className="text-lg font-medium text-gray-800">モデル設定</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Geminiモデル
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as typeof MODEL_OPTIONS[number])}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {MODEL_OPTIONS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          使用するGemini AIモデルを選択してください。
        </p>
      </div>
    </div>
  )
}
