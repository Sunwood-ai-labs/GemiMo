import { useEffect, useState } from 'react'
import { Resolution, RESOLUTION_OPTIONS } from '../types/camera'
import { useCameraPermission } from './camera/useCameraPermission'
import { useCameraSelection } from './camera/useCameraSelection'
import { useCameraInitialization } from './camera/useCameraInitialization'

export const useCameraDevices = () => {
  const { hasPermission, error: permissionError, requestPermission } = useCameraPermission()
  const { 
    availableCameras, 
    selectedCamera, 
    setSelectedCamera,
    toggleCamera,
    facingMode,
    updateCameraList 
  } = useCameraSelection()
  const {
    selectedResolution,
    setSelectedResolution,
    initializeCamera,
    error: initError
  } = useCameraInitialization()

  const error = permissionError || initError

  useEffect(() => {
    if (hasPermission) {
      updateCameraList()
    }
  }, [hasPermission])

  return {
    availableCameras,
    selectedCamera,
    facingMode,
    selectedResolution,
    error,
    hasCamera: availableCameras.length > 0,
    setSelectedCamera,
    setSelectedResolution,
    toggleCamera,
    initializeCamera,
    requestPermission,
    updateCameraList
  }
}
