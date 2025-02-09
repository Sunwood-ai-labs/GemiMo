import { useState, useEffect, useRef } from 'react'
import { SleepState } from '../../lib/types'
import { CameraPreview } from '../debug/camera/CameraPreview'
import { useAlarmSound } from '../../lib/hooks/useAlarmSound'
import { useCameraDevices } from '../../lib/hooks/useCameraDevices'
import { useSettings } from '../../lib/hooks/useSettings'
import { CameraControls } from '../debug/camera/CameraControls'

interface AlarmSettingsProps {
  onSubmit: (settings: {
    time: string
    sounds: Record<SleepState, string>
  }) => void
  enabled: boolean
  shouldPlayAlarm: SleepState | null
  onStopAlarm: () => void
}

export const AlarmSettings = ({ onSubmit, enabled, shouldPlayAlarm, onStopAlarm }: AlarmSettingsProps) => {
  const [alarmTime, setAlarmTime] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [forceAlarmState, setForceAlarmState] = useState<SleepState | null>(null)
  const [selectedSound, setSelectedSound] = useState({
    SLEEPING: '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3',
    STRUGGLING: '/sounds/struggling/Feline Symphony.mp3',
    AWAKE: '/sounds/awake/Silent Whisper of the Sakura.mp3',
    UNKNOWN: ''
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const { settings } = useSettings()
  const cameraProps = useCameraDevices()
  const { playSound, stopSound, isPlaying, isLoaded, error } = useAlarmSound()

  // サウンド状態のログ出力
  useEffect(() => {
    if (error) {
      console.error('[AlarmSettings] Sound error:', error)
    }
  }, [error])

  useEffect(() => {
    // Update current time
    const updateCurrentTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    // Initial update
    updateCurrentTime()
    // Update every minute
    const interval = setInterval(updateCurrentTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (settings && videoRef.current) {
      cameraProps.setSelectedCamera(settings.cameraId)
      cameraProps.initializeCamera(videoRef)
    }
  }, [settings, cameraProps.selectedCamera, cameraProps.facingMode, cameraProps.selectedResolution])

  // アラーム音の制御（通常のアラームと強制アラーム）
  useEffect(() => {
    const state = shouldPlayAlarm || forceAlarmState
    if (state) {
      console.log(`[AlarmSettings] Playing alarm for state: ${state}`)
      playSound(state, { volume: 0.8, frequency: 800 })
    } else {
      console.log('[AlarmSettings] Stopping alarm')
      stopSound()
    }
    return () => {
      console.log('[AlarmSettings] Cleaning up alarm')
      stopSound()
    }
  }, [shouldPlayAlarm, forceAlarmState])

  // 強制アラーム起動の処理
  const handleForceAlarm = (state: SleepState) => {
    console.log(`[AlarmSettings] Force alarm state: ${state}`)
    if (forceAlarmState === state) {
      setForceAlarmState(null)
    } else {
      setForceAlarmState(state)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (enabled) {
      console.log('[AlarmSettings] Stopping alarm via form submit')
      onStopAlarm()
    } else {
      console.log('[AlarmSettings] Starting alarm with time:', alarmTime)
      onSubmit({
        time: alarmTime,
        sounds: selectedSound
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Camera Preview */}
      <div className="mb-4">
        <CameraControls 
          selectedCamera={cameraProps.selectedCamera}
          setSelectedCamera={cameraProps.setSelectedCamera}
          toggleCamera={cameraProps.toggleCamera}
          error={cameraProps.error}
          availableCameras={cameraProps.availableCameras}
          selectedResolution={cameraProps.selectedResolution}
        />
      </div>
      <div className="mb-8">
        <CameraPreview
          videoRef={videoRef}
          facingMode={cameraProps.facingMode}
          isAnalyzing={false}
          processingStatus=""
        />
      </div>

      {/* Current time display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-display text-gray-800 mb-2">
          {currentTime}
        </div>
        {enabled && alarmTime && (
          <div className="text-sm text-gray-600">
            アラーム設定時刻: {alarmTime}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          アラーム時刻
        </label>
        <input
          type="time"
          value={alarmTime}
          onChange={(e) => setAlarmTime(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">アラーム音の設定</h3>
        <div className="space-y-4">
          {(Object.keys(selectedSound) as SleepState[]).filter(state => state !== 'UNKNOWN').map((state) => (
            <div key={state} className="flex items-center justify-between">
              <label className="text-sm text-gray-600">
                {state === 'SLEEPING' && '睡眠中'}
                {state === 'STRUGGLING' && 'もがき中'}
                {state === 'AWAKE' && '起床時'}
              </label>
              <select
                value={selectedSound[state]}
                onChange={(e) => setSelectedSound({
                  ...selectedSound,
                  [state]: e.target.value
                })}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="/sounds/sleeping/Moonlight-Bamboo-Forest.mp3">Moonlight Bamboo Forest</option>
                <option value="/sounds/struggling/Feline Symphony.mp3">Feline Symphony</option>
                <option value="/sounds/awake/Silent Whisper of the Sakura.mp3">Silent Whisper of the Sakura</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Sound State Display */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">アラーム状態</h3>
        <div className="space-y-2 text-sm">
          <p className="flex justify-between">
            <span className="text-gray-600">読み込み状態:</span>
            <span className={isLoaded ? 'text-green-600' : 'text-gray-600'}>
              {isLoaded ? '準備完了' : '読み込み中...'}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">再生状態:</span>
            <span className={isPlaying ? 'text-green-600' : 'text-gray-600'}>
              {isPlaying ? '再生中' : '停止中'}
            </span>
          </p>
        </div>
      </div>

      {/* デバッグ用強制アラーム起動ボタン */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700">デバッグ用アラーム制御</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleForceAlarm('SLEEPING')}
            className={`px-4 py-2 rounded-lg text-white text-sm ${
              !isLoaded && forceAlarmState === 'SLEEPING' ? 'animate-pulse' : 
              forceAlarmState === 'SLEEPING' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            睡眠中アラーム
          </button>
          <button
            type="button"
            onClick={() => handleForceAlarm('STRUGGLING')}
            className={`px-4 py-2 rounded-lg text-white text-sm ${
              !isLoaded && forceAlarmState === 'STRUGGLING' ? 'animate-pulse' : 
              forceAlarmState === 'STRUGGLING' ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            もがき中アラーム
          </button>
          <button
            type="button"
            onClick={() => handleForceAlarm('AWAKE')}
            className={`px-4 py-2 rounded-lg text-white text-sm ${
              !isLoaded && forceAlarmState === 'AWAKE' ? 'animate-pulse' : 
              forceAlarmState === 'AWAKE' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            起床中アラーム
          </button>
          <button
            type="button"
            onClick={() => stopSound()}
            className="col-span-3 px-4 py-2 rounded-lg text-white text-sm bg-red-500 hover:bg-red-600"
          >
            アラーム停止
          </button>
        </div>
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
          enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {enabled ? 'アラーム停止' : 'アラーム開始'}
      </button>
    </form>
  )
}
