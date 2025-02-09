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
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentState, setCurrentState] = useState<SleepState>('UNKNOWN')
  const [targetVolume, setTargetVolume] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Audio要素の作成
    audioRef.current = new Audio()
    return () => {
      if (audioRef.current) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const playSound = (state: SleepState, config: AlarmSoundConfig) => {
    if (!audioRef.current || state === 'UNKNOWN') return
    
    const soundPath = getSoundPath(state)
    if (!soundPath) return

    try {
      // 状態が変化した場合は新しい音声をロード
      if (state !== currentState) {
        audioRef.current.src = soundPath
        audioRef.current.loop = true // ループ再生を有効化
        setCurrentState(state)
        setIsLoaded(false)

        // 音声ロードイベントの設定
        audioRef.current.oncanplaythrough = () => {
          setIsLoaded(true)
          startPlayback(config.volume)
        }

        // エラーハンドリング
        audioRef.current.onerror = (e) => {
          console.error('Audio loading error:', e)
          setIsLoaded(false)
          setIsPlaying(false)
        }
      } else if (isLoaded) {
        // 同じ状態の場合は直接再生開始
        startPlayback(config.volume)
      }
    } catch (err) {
      console.error('Error in playSound:', err)
    }
  }

  const startPlayback = (targetVol: number) => {
    if (!audioRef.current) return

    // 初期音量を0に設定
    audioRef.current.volume = 0
    setTargetVolume(Math.min(Math.max(targetVol, 0), 1))

    // フェードインの開始
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true)
        // フェードイン処理
        fadeIntervalRef.current = setInterval(() => {
          if (!audioRef.current) return
          const newVolume = Math.min(audioRef.current.volume + 0.05, targetVolume)
          audioRef.current.volume = newVolume
          if (newVolume >= targetVolume) {
            clearInterval(fadeIntervalRef.current!)
            fadeIntervalRef.current = null
          }
        }, 100)
      })
      .catch(err => console.error('Error starting playback:', err))
  }

  const stopSound = () => {
    if (!audioRef.current) return
    // フェードアウト
    const fadeOut = setInterval(() => {
      if (!audioRef.current || audioRef.current.volume <= 0.05) {
        clearInterval(fadeOut)
        audioRef.current?.pause()
        setIsPlaying(false)
        return
      }
      audioRef.current.volume -= 0.05
    }, 100)
  }

  return {
    playSound,
    stopSound,
    isPlaying,
    isLoaded
  }
}
