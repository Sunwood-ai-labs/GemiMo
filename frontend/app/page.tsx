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
    console.log(message) // ブラウザコンソールにも出力
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`].slice(-10))
  }

  // 時間差を計算してカウントダウン文字列を生成
  const calculateTimeRemaining = (targetTime: string): string => {
    const [hours, minutes] = targetTime.split(':').map(Number)
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    
    const now = new Date()
    if (target.getTime() < now.getTime()) {
      // 翌日の同時刻に設定
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

    // 現在時刻が設定時刻以降であればtrue
    return now.getTime() >= target.getTime()
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const currentTimeStr = `${hours}:${minutes}`
      setCurrentTime(currentTimeStr)

      // アラーム制御
      if (alarmEnabled && currentSettings) {
        // カウントダウンの更新
        setCountdown(calculateTimeRemaining(currentSettings.time))
        
        // 設定時刻を過ぎているかチェック
        if (isTimeToAlarm(currentSettings.time)) {
          addLog(`アラーム起動条件成立: 設定時刻 ${currentSettings.time} <= 現在時刻 ${currentTimeStr}`)
          setShouldPlayAlarm('SLEEPING')
        }
      }
    }

    updateTime() // 初回実行
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
    // 設定時に既に時間を過ぎている場合はすぐにアラームを起動
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
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-display text-gray-800 mb-4">
          Smart Sleep Recognition
        </h1>
        <p className="text-xl font-display text-gray-600">
          Advanced AI-powered sleep monitoring system that watches over your peaceful rest using cutting-edge 3D recognition technology.
        </p>
      </header>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <AlarmSettings
          onSubmit={handleAlarmSubmit}
          enabled={alarmEnabled}
          shouldPlayAlarm={shouldPlayAlarm}
          onStopAlarm={handleStopAlarm}
        />

        {/* Status Display */}
        {alarmEnabled && currentSettings && (
          <div className="mt-6 space-y-4">
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
              <p className="text-center text-3xl font-mono text-blue-800 mt-2">
                {countdown}
              </p>
            </div>

            {/* ログ表示 */}
            <div className="mt-4 p-4 bg-gray-800 rounded-lg overflow-hidden">
              <p className="text-white text-sm mb-2 font-semibold">処理ログ:</p>
              <div className="space-y-1 h-32 overflow-y-auto text-xs">
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

      <div className="mt-8 text-center">
        <Link 
          href="/debug" 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Open Debug Panel
        </Link>
      </div>
    </div>
  )
}
