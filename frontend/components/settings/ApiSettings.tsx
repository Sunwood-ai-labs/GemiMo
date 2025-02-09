interface ApiSettingsProps {
  apiKey: string
  onApiKeyChange: (apiKey: string) => void
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiKey,
  onApiKeyChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">API設定</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Gemini API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="AIza..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <p className="text-xs text-gray-500">
          Google Cloud ConsoleからGemini APIキーを取得してください。
        </p>
      </div>
    </div>
  )
}
