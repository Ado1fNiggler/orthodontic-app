import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCameraOptions {
  facingMode?: 'user' | 'environment'
  video?: boolean
  audio?: boolean
  width?: number
  height?: number
  aspectRatio?: number
}

interface UseCameraReturn {
  stream: MediaStream | null
  isLoading: boolean
  error: string | null
  isSupported: boolean
  devices: MediaDeviceInfo[]
  currentDeviceId: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  capturePhoto: () => Promise<Blob | null>
  takeScreenshot: (element: HTMLVideoElement) => Promise<Blob | null>
  getDevices: () => Promise<MediaDeviceInfo[]>
  setConstraints: (constraints: MediaStreamConstraints) => void
}

interface CameraConstraints extends MediaStreamConstraints {
  video?: boolean | {
    facingMode?: string | { exact: string } | { ideal: string }
    width?: number | { min?: number; max?: number; ideal?: number }
    height?: number | { min?: number; max?: number; ideal?: number }
    aspectRatio?: number | { min?: number; max?: number; ideal?: number }
    deviceId?: string | { exact: string } | { ideal: string }
    frameRate?: number | { min?: number; max?: number; ideal?: number }
  }
  audio?: boolean | {
    echoCancellation?: boolean
    noiseSuppression?: boolean
    autoGainControl?: boolean
  }
}

const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const {
    facingMode = 'environment',
    video = true,
    audio = false,
    width,
    height,
    aspectRatio
  } = options

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const constraintsRef = useRef<CameraConstraints>({})

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasGetUserMedia = !!(
        navigator.mediaDevices?.getUserMedia ||
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia
      )

      const hasMediaDevices = !!navigator.mediaDevices
      
      setIsSupported(hasGetUserMedia && hasMediaDevices)
    }

    checkSupport()
  }, [])

  // Build constraints from options
  const buildConstraints = useCallback((deviceId?: string): CameraConstraints => {
    const videoConstraints: any = video ? {} : false

    if (video && typeof video === 'boolean') {
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId }
      } else {
        videoConstraints.facingMode = { ideal: facingMode }
      }

      if (width) {
        videoConstraints.width = { ideal: width }
      }

      if (height) {
        videoConstraints.height = { ideal: height }
      }

      if (aspectRatio) {
        videoConstraints.aspectRatio = { ideal: aspectRatio }
      }

      // Default resolution constraints for different facing modes
      if (!width && !height) {
        if (facingMode === 'environment') {
          videoConstraints.width = { ideal: 1920 }
          videoConstraints.height = { ideal: 1080 }
        } else {
          videoConstraints.width = { ideal: 1280 }
          videoConstraints.height = { ideal: 720 }
        }
      }

      videoConstraints.frameRate = { ideal: 30 }
    }

    const audioConstraints: any = audio ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    } : false

    return {
      video: videoConstraints,
      audio: audioConstraints
    }
  }, [facingMode, video, audio, width, height, aspectRatio])

  // Get available media devices
  const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!isSupported) return []

    try {
      // Request permissions first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput')
      
      setDevices(videoDevices)
      return videoDevices
    } catch (error) {
      console.error('Error enumerating devices:', error)
      setError('Δεν ήταν δυνατή η πρόσβαση στις συσκευές κάμερας')
      return []
    }
  }, [isSupported])

  // Start camera
  const startCamera = useCallback(async (deviceId?: string): Promise<void> => {
    if (!isSupported) {
      setError('Η κάμερα δεν υποστηρίζεται σε αυτό τον browser')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = buildConstraints(deviceId)
      constraintsRef.current = constraints

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      streamRef.current = newStream
      setStream(newStream)
      
      // Get the actual device ID being used
      const videoTrack = newStream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        setCurrentDeviceId(settings.deviceId || null)
      }

      setError(null)
    } catch (err: any) {
      console.error('Error starting camera:', err)
      
      let errorMessage = 'Σφάλμα πρόσβασης στην κάμερα'
      
      switch (err.name) {
        case 'NotAllowedError':
          errorMessage = 'Δεν έχετε δώσει άδεια για πρόσβαση στην κάμερα'
          break
        case 'NotFoundError':
          errorMessage = 'Δεν βρέθηκε κάμερα στη συσκευή σας'
          break
        case 'NotReadableError':
          errorMessage = 'Η κάμερα χρησιμοποιείται από άλλη εφαρμογή'
          break
        case 'OverconstrainedError':
          errorMessage = 'Οι ρυθμίσεις κάμερας δεν υποστηρίζονται'
          break
        case 'SecurityError':
          errorMessage = 'Πρόβλημα ασφαλείας με την πρόσβαση στην κάμερα'
          break
        default:
          errorMessage = `Σφάλμα κάμερας: ${err.message}`
      }
      
      setError(errorMessage)
      setStream(null)
      streamRef.current = null
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, buildConstraints])

  // Stop camera
  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
      setStream(null)
      setCurrentDeviceId(null)
    }
  }, [])

  // Switch camera (front/back)
  const switchCamera = useCallback(async (): Promise<void> => {
    if (!isSupported || devices.length < 2) return

    try {
      // Find the next available camera
      const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId)
      const nextIndex = (currentIndex + 1) % devices.length
      const nextDevice = devices[nextIndex]

      if (nextDevice) {
        await startCamera(nextDevice.deviceId)
      }
    } catch (error) {
      console.error('Error switching camera:', error)
      setError('Δεν ήταν δυνατή η εναλλαγή κάμερας')
    }
  }, [isSupported, devices, currentDeviceId, startCamera])

  // Capture photo from video stream
  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!stream) {
      setError('Δεν υπάρχει ενεργό stream κάμερας')
      return null
    }

    try {
      // Create video element to capture frame
      const video = document.createElement('video')
      video.srcObject = stream
      video.playsInline = true
      video.muted = true

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play()
          
          // Wait for video to start playing
          video.onplaying = () => {
            try {
              const canvas = document.createElement('canvas')
              const context = canvas.getContext('2d')
              
              if (!context) {
                reject(new Error('Canvas context not available'))
                return
              }

              canvas.width = video.videoWidth
              canvas.height = video.videoHeight

              // Draw video frame to canvas
              context.drawImage(video, 0, 0, canvas.width, canvas.height)

              // Convert to blob
              canvas.toBlob((blob) => {
                video.remove()
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Failed to create image blob'))
                }
              }, 'image/jpeg', 0.9)
            } catch (error) {
              video.remove()
              reject(error)
            }
          }
        }

        video.onerror = () => {
          video.remove()
          reject(new Error('Video loading failed'))
        }
      })
    } catch (error) {
      console.error('Error capturing photo:', error)
      setError('Σφάλμα κατά τη λήψη φωτογραφίας')
      return null
    }
  }, [stream])

  // Take screenshot from video element
  const takeScreenshot = useCallback(async (videoElement: HTMLVideoElement): Promise<Blob | null> => {
    if (!videoElement) {
      setError('Δεν παρέχηκε video element')
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        setError('Canvas context not available')
        return null
      }

      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight

      // Draw video frame to canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create screenshot blob'))
          }
        }, 'image/jpeg', 0.9)
      })
    } catch (error) {
      console.error('Error taking screenshot:', error)
      setError('Σφάλμα κατά τη λήψη screenshot')
      return null
    }
  }, [])

  // Set custom constraints
  const setConstraints = useCallback((constraints: MediaStreamConstraints): void => {
    constraintsRef.current = constraints
  }, [])

  // Initialize and get devices on mount
  useEffect(() => {
    if (isSupported) {
      getDevices()
    }
  }, [isSupported, getDevices])

  // Handle device changes
  useEffect(() => {
    if (!isSupported) return

    const handleDeviceChange = () => {
      getDevices()
    }

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange)

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [isSupported, getDevices])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Handle page visibility change (pause/resume)
  useEffect(() => {
    if (!isSupported) return

    const handleVisibilityChange = () => {
      if (document.hidden && streamRef.current) {
        // Pause video tracks when page is hidden
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false
        })
      } else if (!document.hidden && streamRef.current) {
        // Resume video tracks when page is visible
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = true
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSupported])

  // Track permission changes
  useEffect(() => {
    if (!isSupported || !navigator.permissions) return

    const checkPermissions = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        
        const handlePermissionChange = () => {
          if (permission.state === 'denied' && stream) {
            stopCamera()
            setError('Η άδεια πρόσβασης στην κάμερα ανακλήθηκε')
          }
        }

        permission.addEventListener('change', handlePermissionChange)

        return () => {
          permission.removeEventListener('change', handlePermissionChange)
        }
      } catch (error) {
        // Permissions API not supported or permission name not recognized
        console.warn('Permissions API not fully supported')
      }
    }

    checkPermissions()
  }, [isSupported, stream, stopCamera])

  return {
    stream,
    isLoading,
    error,
    isSupported,
    devices,
    currentDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    takeScreenshot,
    getDevices,
    setConstraints
  }
}

export default useCamera
export type { UseCameraOptions, UseCameraReturn }import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCameraOptions {
  facingMode?: 'user' | 'environment'
  video?: boolean
  audio?: boolean
  width?: number
  height?: number
  aspectRatio?: number
}

interface UseCameraReturn {
  stream: MediaStream | null
  isLoading: boolean
  error: string | null
  isSupported: boolean
  devices: MediaDeviceInfo[]
  currentDeviceId: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  capturePhoto: () => Promise<Blob | null>
  takeScreenshot: (element: HTMLVideoElement) => Promise<Blob | null>
  getDevices: () => Promise<MediaDeviceInfo[]>
  setConstraints: (constraints: MediaStreamConstraints) => void
}

interface CameraConstraints extends MediaStreamConstraints {
  video?: boolean | {
    facingMode?: string | { exact: string } | { ideal: string }
    width?: number | { min?: number; max?: number; ideal?: number }
    height?: number | { min?: number; max?: number; ideal?: number }
    aspectRatio?: number | { min?: number; max?: number; ideal?: number }