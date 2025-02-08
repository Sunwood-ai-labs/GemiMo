'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MODEL_OPTIONS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-pro-preview-02-05"
] as const

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [currentModel, setCurrentModel] = useState<typeof MODEL_OPTIONS[number]>("gemini-2.0-flash")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  useEffect(() => {
    // Load current settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.apiKey) {
          setApiKey(data.apiKey)
        }
        if (data.model) {
          setCurrentModel(data.model)
        }
      })
      .catch(err => {
        setMessage({ type: 'error', text: 'Failed to load settings' })
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey,
          model: currentModel
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
        // Send model update through WebSocket
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/gemimo'
        const ws = new WebSocket(wsUrl)
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'config', model: currentModel }))
          ws.close()
        }
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display text-gray-800">Settings</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Back to Monitor
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini Model
            </label>
            <select
              id="model"
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value as typeof MODEL_OPTIONS[number])}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent text-sm"
            >
              {MODEL_OPTIONS.map((modelId) => (
                <option key={modelId} value={modelId}>
                  {modelId}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the Gemini model to use for sleep analysis
            </p>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent text-sm"
                placeholder="Enter your Gemini API key"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your API key is stored securely and never shared
            </p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg text-sm ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/80 text-white transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
