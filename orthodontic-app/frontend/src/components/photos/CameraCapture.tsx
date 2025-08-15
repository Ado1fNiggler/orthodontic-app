import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  PhotoIcon,
  VideoCameraIcon,
  StopIcon,
  AdjustmentsHorizontalIcon,
  SunIcon,
  MoonIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline'

// Components
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'

// Hooks
import { useCamera } from '@hooks/useCamera'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (blob: Blob, metadata?: CaptureMetadata) => void
  onError?: (error: string) => void
  mode?: 'photo' | 'video'
  quality?: number
  facingMode?: 'user' | 'environment'
  className?: string
}

interface CaptureMetadata {
  timestamp: number
  facingMode: string
  resolution: {
    width: number
    height: number
  }
  flash?: boolean
  filters?: string[]
}

interface CameraSettings {
  facingMode: 'user' | 'environment'
  quality: number
  flash: boolean
  timer: number
  grid: boolean
  filters: string[]
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  onError,
  mode = 'photo',
  quality = 0.9,
  facingMode = 'environment',
  className
}) => {
  const [settings, setSettings] = useState<CameraSettings>({
    facingMode,
    quality,
    flash: false,
    timer: 0,
    grid: false,
    filters: []
  })
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()
  const recordingTimerRef = useRef<NodeJS.Timeout>()

  const {
    stream,
    isLoading,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto: capturePhotoHook,
    isSupported
  } = useCamera({
    facingMode: settings.facingMode,
    video: true,
    audio: mode === 'video'
  })

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && isSupported) {
      startCamera()
      getAvailableDevices()
    } else if (!isOpen) {
      stopCamera()
      cleanup()
    }

    return () => {
      cleanup()
    }
  }, [isOpen, isSupported, startCamera, stopCamera])

  // Assign stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Get available camera devices
  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableDevices(videoDevices)
    } catch (error) {
      console.error('Error getting devices:', error)
    }
  }

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
    setCountdown(0)
    setRecordingTime(0)
    setIsRecording(false)
    setCapturedImage(null)
    recordedChunks.current = []
  }, [])

  // Handle photo capture
  const handlePhotoCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      if (settings.timer > 0) {
        // Start countdown
        setCountdown(settings.timer)
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!)
              performCapture()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        performCapture()
      }
    } catch (error) {
      onError?.('Σφάλμα κατά τη λήψη φωτογραφίας')
      console.error('Capture error:', error)
    }
  }, [settings.timer, onError])

  // Perform actual capture
  const performCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Apply flash effect
    if (settings.flash) {
      const flashDiv = document.createElement('div')
      flashDiv.style.position = 'fixed'
      flashDiv.style.top = '0'
      flashDiv.style.left = '0'
      flashDiv.style.width = '100%'
      flashDiv.style.height = '100%'
      flashDiv.style.backgroundColor = 'white'
      flashDiv.style.zIndex = '9999'
      flashDiv.style.opacity = '0.8'
      document.body.appendChild(flashDiv)
      
      setTimeout(() => {
        document.body.removeChild(flashDiv)
      }, 100)
    }

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Apply filters if any
    if (settings.filters.length > 0) {
      applyFilters(context, canvas.width, canvas.height)
    }

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const metadata: CaptureMetadata = {
          timestamp: Date.now(),
          facingMode: settings.facingMode,
          resolution: {
            width: canvas.width,
            height: canvas.height
          },
          flash: settings.flash,
          filters: settings.filters
        }

        setCapturedImage(canvas.toDataURL())
        onCapture(blob, metadata)
      }
    }, 'image/jpeg', settings.quality)
  }, [settings, onCapture])

  // Apply image filters
  const applyFilters = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data

    settings.filters.forEach(filter => {
      switch (filter) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            data[i] = gray
            data[i + 1] = gray
            data[i + 2] = gray
          }
          break
        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
          }
          break
        case 'invert':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]
            data[i + 1] = 255 - data[i + 1]
            data[i + 2] = 255 - data[i + 2]
          }
          break
      }
    })

    context.putImageData(imageData, 0, 0)
  }

  // Handle video recording
  const handleVideoRecording = useCallback(async () => {
    if (!stream) return

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    } else {
      // Start recording
      try {
        recordedChunks.current = []
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        })

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks.current, {
            type: 'video/webm'
          })
          
          const metadata: CaptureMetadata = {
            timestamp: Date.now(),
            facingMode: settings.facingMode,
            resolution: {
              width: videoRef.current?.videoWidth || 0,
              height: videoRef.current?.videoHeight || 0
            }
          }

          onCapture(blob, metadata)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsRecording(true)
        setRecordingTime(0)

        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)

      } catch (error) {
        onError?.('Σφάλμα κατά την εγγραφή βίντεο')
        console.error('Recording error:', error)
      }
    }
  }, [stream, isRecording, settings, onCapture, onError])

  // Switch camera
  const handleCameraSwitch = useCallback(() => {
    const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user'
    setSettings(prev => ({ ...prev, facingMode: newFacingMode }))
    switchCamera()
  }, [settings.facingMode, switchCamera])

  // Toggle filter
  const toggleFilter = useCallback((filter: string) => {
    setSettings(prev => ({
      ...prev,
      filters: prev.filters.includes(filter)
        ? prev.filters.filter(f => f !== filter)
        : [...prev.filters, filter]
    }))
  }, [])

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Κάμερα">
        <div className="text-center py-8">
          <CameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Η κάμερα δεν υποστηρίζεται
          </h3>
          <p className="text-gray-600">
            Ο browser σας δεν υποστηρίζει πρόσβαση στην κάμερα
          </p>
        </div>
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Σφάλμα κάμερας">
        <div className="text-center py-8">
          <CameraIcon className="h-16 w-16 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Σφάλμα πρόσβασης στην κάμερα
          </h3>
          <p className="text-red-600 mb-4">
            {error}
          </p>
          <Button onClick={() => startCamera()}>
            Δοκιμάστε ξανά
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="full"
      className="bg-black"
    >
      <div className={`relative h-full bg-black ${className}`}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <LoadingSpinner size="lg" className="text-white" />
              <p className="mt-4 text-white">Εκκίνηση κάμερας...</p>
            </div>
          </div>
        )}

        {/* Video preview */}
        <div className="relative h-full flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Grid overlay */}
          {settings.grid && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="33.333%" height="33.333%" patternUnits="objectBoundingBox">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          )}

          {/* Countdown overlay */}
          <AnimatePresence>
            {countdown > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
              >
                <div className="text-8xl font-bold text-white">
                  {countdown}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">REC {formatTime(recordingTime)}</span>
            </div>
          )}

          {/* Top controls */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-0 right-0 bottom-0 w-80 bg-black bg-opacity-80 backdrop-blur-sm p-4 overflow-y-auto"
              >
                <div className="space-y-4 text-white">
                  <h3 className="text-lg font-medium mb-4">Ρυθμίσεις κάμερας</h3>

                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ποιότητα: {Math.round(settings.quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={settings.quality}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        quality: parseFloat(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>

                  {/* Timer */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Χρονοκαθυστέρηση: {settings.timer}s
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={settings.timer}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        timer: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>

                  {/* Flash */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Flash</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, flash: !prev.flash }))}
                      className={`p-2 rounded ${
                        settings.flash ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}
                    >
                      {settings.flash ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Grid */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Πλέγμα</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, grid: !prev.grid }))}
                      className={`p-2 rounded ${
                        settings.grid ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <Square3Stack3DIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Filters */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Φίλτρα</label>
                    <div className="space-y-2">
                      {['grayscale', 'sepia', 'invert'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => toggleFilter(filter)}
                          className={`w-full p-2 text-left rounded ${
                            settings.filters.includes(filter) 
                              ? 'bg-primary-600' 
                              : 'bg-gray-600'
                          }`}
                        >
                          {filter === 'grayscale' && 'Ασπρόμαυρο'}
                          {filter === 'sepia' && 'Σέπια'}
                          {filter === 'invert' && 'Αντιστροφή'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom controls */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-8">
            {/* Camera switch (if multiple cameras available) */}
            {availableDevices.length > 1 && (
              <Button
                variant="ghost"
                size="lg"
                onClick={handleCameraSwitch}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full p-4"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </Button>
            )}

            {/* Capture/Record button */}
            <Button
              size="lg"
              onClick={mode === 'photo' ? handlePhotoCapture : handleVideoRecording}
              disabled={countdown > 0}
              className={`rounded-full p-6 ${
                mode === 'video' && isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {mode === 'photo' ? (
                <CameraIcon className="h-8 w-8 text-gray-900" />
              ) : isRecording ? (
                <StopIcon className="h-8 w-8 text-white" />
              ) : (
                <VideoCameraIcon className="h-8 w-8 text-gray-900" />
              )}
            </Button>

            {/* Mode switch */}
            {mode === 'photo' && (
              <Button
                variant="ghost"
                size="lg"
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full p-4"
              >
                <PhotoIcon className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Captured image preview */}
        {capturedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-8 left-8 w-20 h-20 rounded-lg overflow-hidden border-2 border-white"
          >
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </div>
    </Modal>
  )
}

export default CameraCapture