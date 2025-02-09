import { useState, useEffect, useRef } from 'react'
import { SleepState } from '../types'

interface AlarmSoundConfig {
  volume: number
  frequency: number
  fade_duration?: number
}

const DEFAULT_FADE_DURATION = 2000 // 2秒

export const useAlarmSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentState, setCurrentState] = useState<SleepState>('UNKNOWN')
  const [targetVolume, setTargetVolume] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // クリーンアップ関数
  const cleanup = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  useEffect(() => {
    // Audio要素の初期化
    audioRef.current = new Audio()
    audioRef.current.onended = () => setIsPlaying(false)
    audioRef.current.onerror = (e) => {
      console.error('Audio error:', e)
      setError('音声の再生中にエラーが発生しました')
      setIsPlaying(false)
    }

    return cleanup
  }, [])

  const getSoundPath = (state: SleepState): string => {
    const paths = {
      SLEEPING: '/sounds/sleeping/Moonlight-Bamboo-Forest.mp3',
      STRUGGLING: '/sounds/struggling/Feline Symphony.mp3',
      AWAKE: '/sounds/awake/Silent Whisper of the Sakura.mp3',
      UNKNOWN: ''
    }
    return paths[state]
  }

  const startFade = (
    startVolume: number, 
    endVolume: number, 
    duration: number,
    onComplete?: () => void
  ) => {
    if (!audioRef.current) return
    
    const steps = Math.max(duration / 50, 1) // 最低でも1ステップ
    const volumeStep = (endVolume - startVolume) / steps
    let currentStep = 0

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    fadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) return
      
      currentStep++
      const newVolume = startVolume + (volumeStep * currentStep)
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume))

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
        if (onComplete) onComplete()
      }
    }, 50)
  }

  const playSound = async (state: SleepState, config: AlarmSoundConfig) => {
    try {
      setError(null)
      if (!audioRef.current || state === 'UNKNOWN') return
      
      const soundPath = getSoundPath(state)
      if (!soundPath) {
        setError('指定された状態の音声ファイルが見つかりません')
        return
      }

      // 状態が変化した場合は新しい音声をロード
      if (state !== currentState || !isLoaded) {
        audioRef.current.src = soundPath
        audioRef.current.loop = true
        setCurrentState(state)
        setIsLoaded(false)

        // 音声のロード完了を待つ
        await new Promise((resolve, reject) => {
          if (!audioRef.current) return reject('Audio element not initialized')
          audioRef.current.oncanplaythrough = resolve
          audioRef.current.onerror = reject
        })

        setIsLoaded(true)
      }

      const fadeDuration = config.fade_duration ?? DEFAULT_FADE_DURATION
      const targetVol = Math.min(Math.max(config.volume, 0), 1)
      setTargetVolume(targetVol)

      // 再生開始（フェードイン）
      audioRef.current.volume = 0
      await audioRef.current.play()
      setIsPlaying(true)
      startFade(0, targetVol, fadeDuration)

    } catch (err) {
      console.error('Error playing sound:', err)
      setError(err instanceof Error ? err.message : '音声の再生に失敗しました')
      setIsPlaying(false)
    }
  }

  const stopSound = () => {
    if (!audioRef.current || !isPlaying) return

    const fadeDuration = 1000 // 1秒でフェードアウト
    startFade(audioRef.current.volume, 0, fadeDuration, () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
    })
  }

  return {
    playSound,
    stopSound,
    isPlaying,
    isLoaded,
    error
  }
}
