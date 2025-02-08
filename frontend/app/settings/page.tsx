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
  const [preferredCameraId, setPreferredCameraId] = useState('')
  const [preferredFacingMode, setPreferredFacingMode] = useState<'user' | 'environment'>('environment')
  const [availableCameras, setAvailableCameras] = useState<Array<{ deviceId: string; label: string }>>([])
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

    // Load camera settings from localStorage
    const savedCameraId = localStorage.getItem('preferredCameraId')
    const savedFacingMode = localStorage.getItem('preferredFacingMode')
    if (savedCameraId) setPreferredCameraId(savedCameraId)
    if (savedFacingMode) setPreferredFacingMode(savedFacingMode as 'user' | 'environment')

    // List available cameras
    const listCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 4)}`
          }))
        setAvailableCameras(cameras)
      } catch (err) {
        console.error('Error listing cameras:', err)
      }
    }

    listCameras()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Save camera preferences to localStorage
      localStorage.setItem('preferredCameraId', preferredCameraId)
      localStorage.setItem('preferredFacingMode', preferredFacingMode)

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
        {/* Camera Settings Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-800">カメラ設定</h2>
          
          <div>
            <label htmlFor="camera" className="block text-sm font-medium text-gray-700 mb-2">
              デフォルトカメラ
            </label>
            <select
              id="camera"
              value={preferredCameraId}
              onChange={(e) => setPreferredCameraId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent text-sm"
            >
              <option value="">自動選択</option>
              {availableCameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              優先カメラ方向
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="environment"
                  checked={preferredFacingMode === 'environment'}
                  onChange={(e) => setPreferredFacingMode(e.target.value as 'environment')}
                  className="form-radio text-brand-primary"
                />
                <span className="ml-2 text-sm text-gray-700">背面カメラ</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="user"
                  checked={preferredFacingMode === 'user'}
                  onChange={(e) => setPreferredFacingMode(e.target.value as 'user')}
                  className="form-radio text-brand-primary"
                />
                <span className="ml-2 text-sm text-gray-700">フロントカメラ</span>
              </label>
            </div>
          </div>
        </div>

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
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
