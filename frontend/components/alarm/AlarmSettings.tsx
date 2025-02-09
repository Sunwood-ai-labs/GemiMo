import { useState } from 'react'
import { SleepState } from '@/lib/types'

interface AlarmSettingsProps {
  onSubmit: (settings: {
    time: string
    sounds: Record<SleepState, string>
  }) => void
  enabled: boolean
}

export const AlarmSettings = ({ onSubmit, enabled }: AlarmSettingsProps) => {
  const [alarmTime, setAlarmTime] = useState('')
  const [selectedSound, setSelectedSound] = useState({
    SLEEPING: '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3',
    STRUGGLING: '/sounds/struggling/Feline Symphony.mp3',
    AWAKE: '/sounds/awake/Silent Whisper of the Sakura.mp3',
    UNKNOWN: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      time: alarmTime,
      sounds: selectedSound
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                {state === 'SLEEPING' && '睡眠時'}
                {state === 'STRUGGLING' && 'もがき時'}
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
                <option value="/sounds/sleeping/Moonlight-Bamboo-Forest.mp3">穏やかな竹林</option>
                <option value="/sounds/struggling/Feline Symphony.mp3">猫の交響曲</option>
                <option value="/sounds/awake/Silent Whisper of the Sakura.mp3">桜のささやき</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
          enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {enabled ? 'アラームを停止' : 'アラームを開始'}
      </button>
    </form>
  )
}
