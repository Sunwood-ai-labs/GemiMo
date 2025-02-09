import { SleepState } from './index'

export type Box3D = number[]

export interface AnalysisResult {
  boxes?: Record<string, Box3D>
  state?: SleepState
  confidence?: number
  position?: [number, number, number]
  orientation?: [number, number, number]
  timestamp?: number
  alarm?: {
    volume: number
    frequency: number
  }
}

export interface CameraDeviceInfo {
  deviceId: string
  label: string
  kind: 'videoinput'
  type: 'webcam' | 'mobile' | 'unknown'
  facing: 'user' | 'environment'
}

export type FacingMode = 'user' | 'environment'

export interface Resolution {
  width: number
  height: number
  label: string
}

export const RESOLUTION_OPTIONS = [
  { label: "低解像度 (640x480)", width: 640, height: 480 },
  { label: "HD (1280x720)", width: 1280, height: 720 },
  { label: "Full HD (1920x1080)", width: 1920, height: 1080 },
] as const

