import { useState, useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { CameraSettings } from './CameraSettings'
import { ApiSettings } from './ApiSettings'
import { ModelSettings } from './ModelSettings'

export const SettingsForm = () => {
  const { 
    settings, 
    isLoading, 
    isSaving,
    message,
    updateSettings 
  } = useSettings()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateSettings(settings)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ApiSettings 
        apiKey={settings.apiKey} 
        onApiKeyChange={(key) => updateSettings({ ...settings, apiKey: key })}
      />
      
      <ModelSettings 
        model={settings.model}
        onModelChange={(model) => updateSettings({ ...settings, model })}
      />
      
      <CameraSettings />

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-2 px-4 bg-brand-primary text-white rounded-md disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}