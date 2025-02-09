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
      <h3 className="text-lg font-display text-gray-800">API Settings</h3>
      <div className="space-y-2">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-600">
          Gemini API Key
        </label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your Gemini API key"
        />
      </div>
    </div>
  )
}
