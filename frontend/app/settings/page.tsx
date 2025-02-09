'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { BackButton } from '@/components/ui/BackButton'

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
        <BackButton />
      </div>
      
      <SettingsForm />
    </div>
  )
}
