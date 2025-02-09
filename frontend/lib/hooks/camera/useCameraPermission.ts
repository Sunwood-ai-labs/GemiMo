import { useState, useEffect } from 'react'

export const useCameraPermission = () => {
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState('')

  const checkPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setHasPermission(result.state === 'granted')
      setError('')
    } catch (err) {
      console.error('Error checking camera permission:', err)
      setError('カメラの権限確認に失敗しました')
    }
  }

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
      setError('')
      return true
    } catch (err) {
      console.error('Error requesting camera permission:', err)
      setError('カメラへのアクセス許可が必要です')
      return false
    }
  }

  useEffect(() => {
    checkPermission()
  }, [])

  return {
    hasPermission,
    error,
    requestPermission
  }
}
