export type SleepState = 'UNKNOWN' | 'SLEEPING' | 'STRUGGLING' | 'AWAKE'

export interface SleepData {
  state: SleepState
  confidence: number
  position: [number, number, number]
  orientation: [number, number, number]
  timestamp: number
  boxes?: Record<string, number[]>
  alarm: {
    volume: number
    frequency: number
  }
}

export interface GemiMoConfig {
  websocketUrl: string
  updateInterval: number
  debug: boolean
}
