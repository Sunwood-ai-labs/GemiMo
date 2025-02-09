import { useState } from 'react'

export const useCameraPermission = () => {
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string>('')

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
      setError('')
    } catch (err) {
      setHasPermission(false)
      setError('Camera permission denied')
    }
  }

  return {
    hasPermission,
    error,
    requestPermission
  }
}