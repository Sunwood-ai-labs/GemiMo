import { useState, useEffect, useRef } from 'react'
import { SleepState } from '../types'

interface AlarmSoundConfig {
  volume: number
  frequency: number
}

const getSoundPath = (state: SleepState): string => {
  switch (state) {
    case 'SLEEPING':
      return '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3'
    case 'STRUGGLING':
      return '/sounds/struggling/Feline Symphony.mp3'
    case 'AWAKE':
      return '/sounds/awake/Silent Whisper of the Sakura.mp3'
    default:
      return ''
  }
}

export const useAlarmSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentState, setCurrentState] = useState<SleepState>('UNKNOWN')
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Audio要素の作成
    audioRef.current = new Audio()
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const playSound = (state: SleepState, config: AlarmSoundConfig) => {
    if (!audioRef.current || state === 'UNKNOWN') return
    
    const soundPath = getSoundPath(state)
    if (!soundPath) return

    // 状態が変化した場合は新しい音声をロード
    if (state !== currentState) {
      audioRef.current.src = soundPath
      setCurrentState(state)
    }

    // 音量の設定
    audioRef.current.volume = Math.min(Math.max(config.volume, 0), 1)

    // 音声の再生
    if (!isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing sound:', err))
    }
  }

  const stopSound = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }

  return {
    playSound,
    stopSound,
    isPlaying
  }
}
