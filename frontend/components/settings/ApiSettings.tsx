interface ApiSettingsProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ apiKey, onApiKeyChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Gemini API Key
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Enter your API key"
      />
      <p className="text-xs text-gray-500">
        Your API key is stored securely in the environment variables
      </p>
    </div>
  )
}