'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlarmSettings } from '@/components/alarm/AlarmSettings'
import { SleepState } from '@/lib/types'

export default function Home() {
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [currentSettings, setCurrentSettings] = useState<{
    time: string;
    sounds: Record<SleepState, string>;
  } | null>(null)
  const [currentTime, setCurrentTime] = useState('')
  const [countdown, setCountdown] = useState<string>('')
  const [shouldPlayAlarm, setShouldPlayAlarm] = useState<SleepState | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // ログ追加関数
  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`].slice(-10))
  }

  // 時間差を計算してカウントダウン文字列を生成
  const calculateTimeRemaining = (targetTime: string): string => {
    const [hours, minutes] = targetTime.split(':').map(Number)
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    
    const now = new Date()
    if (target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 1)
    }
    
    const diff = target.getTime() - now.getTime()
    const diffHours = Math.floor(diff / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const diffSeconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`
  }

  // 設定時刻を過ぎているかチェック
  const isTimeToAlarm = (targetTime: string): boolean => {
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number)
    const now = new Date()
    const target = new Date()
    target.setHours(targetHours, targetMinutes, 0, 0)

    return now.getTime() >= target.getTime()
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const currentTimeStr = `${hours}:${minutes}`
      setCurrentTime(currentTimeStr)

      if (alarmEnabled && currentSettings) {
        setCountdown(calculateTimeRemaining(currentSettings.time))
        
        if (isTimeToAlarm(currentSettings.time)) {
          addLog(`アラーム起動条件成立: 設定時刻 ${currentSettings.time} <= 現在時刻 ${currentTimeStr}`)
          setShouldPlayAlarm('SLEEPING')
        }
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [alarmEnabled, currentSettings])

  const handleAlarmSubmit = (settings: {
    time: string;
    sounds: Record<SleepState, string>;
  }) => {
    addLog(`アラーム設定: ${settings.time}`)
    setAlarmEnabled(true)
    setCurrentSettings(settings)
    if (isTimeToAlarm(settings.time)) {
      addLog('設定時刻経過済み - 即時アラーム起動')
      setShouldPlayAlarm('SLEEPING')
    } else {
      setShouldPlayAlarm(null)
    }
  }

  const handleStopAlarm = () => {
    addLog('アラーム停止')
    setAlarmEnabled(false)
    setShouldPlayAlarm(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-display text-gray-800 mb-3 sm:mb-4">
            Smart Wake Companion
          </h1>
          <p className="text-lg sm:text-xl font-display text-gray-600 max-w-2xl mx-auto px-4">
            Wake up naturally with AI that understands your sleep patterns through advanced 3D sensing.
          </p>
        </header>

        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <AlarmSettings
              onSubmit={handleAlarmSubmit}
              enabled={alarmEnabled}
              shouldPlayAlarm={shouldPlayAlarm}
              onStopAlarm={handleStopAlarm}
            />

            {alarmEnabled && currentSettings && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* アラーム情報 */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-center text-gray-700">
                      アラーム設定時刻: {currentSettings.time}
                    </p>
                    <p className="text-center text-gray-700 mt-2">
                      現在時刻: {currentTime}
                    </p>
                  </div>
                  
                  {/* カウントダウン表示 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-center text-lg font-semibold text-blue-700">
                      {shouldPlayAlarm ? 'アラーム起動中' : 'アラームまで:'}
                    </p>
                    <p className="text-center text-2xl sm:text-3xl font-mono text-blue-800 mt-2">
                      {countdown}
                    </p>
                  </div>
                </div>

                {/* ログ表示 */}
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-white text-sm mb-2 font-semibold">処理ログ:</p>
                  <div className="space-y-1 h-28 sm:h-32 overflow-y-auto text-xs">
                    {logs.map((log, index) => (
                      <p key={index} className="text-gray-300 font-mono">
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <Link 
              href="/debug" 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Open Debug Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
