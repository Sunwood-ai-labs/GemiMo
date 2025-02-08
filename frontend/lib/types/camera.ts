export interface Box3D {
  position: [number, number, number] // [x, y, z]
  dimensions: [number, number, number] // [width, height, depth]
  rotation: [number, number, number] // [roll, pitch, yaw]
  confidence: number
}

export interface Box3DData {
  box_3d: number[];  // [x,y,z, width,height,depth, roll,pitch,yaw]
  label: string;
}

export interface AnalysisResult {
  boxes?: Record<string, Box3D>
  state?: string
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
}

export type FacingMode = 'user' | 'environment';
