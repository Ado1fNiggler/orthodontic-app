import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  PhotoIcon,
  CameraIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import LoadingSpinner from '@components/common/LoadingSpinner'
import Dropdown from '@components/common/Dropdown'

// Hooks
import { useCamera } from '@hooks/useCamera'

// Types
interface PhotoFile {
  file: File
  preview: string
  id: string
  progress?: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface PhotoUploaderProps {
  patientId?: string
  category?: string
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  onUploadComplete?: (photos: any[]) => void
  onUploadProgress?: (progress: number) => void
  className?: string
  compact?: boolean
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  patientId,
  category = 'clinical',
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  onUploadComplete,
  onUploadProgress,
  className,
  compact = false
}) => {
  const [files, setFiles] = useState<PhotoFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { capturePhoto, isSupported: cameraSupported } = useCamera()

  // Photo categories
  const categoryOptions = [
    { label: 'Κλινικές', value: 'clinical' },
    { label: 'Πριν τη θεραπεία', value: 'before' },
    { label: 'Κατά τη θεραπεία', value: 'during' },
    { label: 'Μετά τη θεραπεία', value: 'after' },
    { label: 'Ακτινογραφίες', value: 'xray' },
    { label: 'Ενδοστοματικές', value: 'intraoral' },
    { label: 'Εξωστοματικές', value: 'extraoral' },
    { label: 'Άλλες', value: 'other' }
  ]

  // File validation
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Μη υποστηριζόμενος τύπος αρχείου. Επιτρέπονται: ${acceptedTypes.join(', ')}`
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: ${maxFileSize}MB`
    }
    
    return null
  }

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        toast.error(`${file.name}: ${error.message}`)
      })
    })

    // Process accepted files
    const newFiles: PhotoFile[] = acceptedFiles.map(file => {
      const validation = validateFile(file)
      
      return {
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        status: validation ? 'error' : 'pending',
        error: validation || undefined
      }
    })

    setFiles(prev => {
      const combined = [...prev, ...newFiles]
      if (combined.length > maxFiles) {
        toast.error(`Μέγιστος αριθμός αρχείων: ${maxFiles}`)
        return combined.slice(0, maxFiles)
      }
      return combined
    })
  }, [maxFiles, maxFileSize, acceptedTypes])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes.map(type => type.replace('image/', '.'))
    },
    maxFiles,
    maxSize: maxFileSize * 1024 * 1024,
    disabled: uploading
  })

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  // Capture photo from camera
  const handleCameraCapture = async () => {
    try {
      const blob = await capturePhoto()
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onDrop([file], [])
      }
    } catch (error) {
      toast.error('Σφάλμα κατά τη λήψη φωτογραφίας')
      console.error('Camera capture error:', error)
    }
  }

  // Upload files
  const uploadFiles = async () => {
    const validFiles = files.filter(f => f.status === 'pending')
    if (validFiles.length === 0) return

    setUploading(true)
    let completedCount = 0

    try {
      const uploadPromises = validFiles.map(async (photoFile) => {
        try {
          // Update status to uploading
          setFiles(prev => prev.map(f => 
            f.id === photoFile.id 
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          ))

          // Create FormData
          const formData = new FormData()
          formData.append('photo', photoFile.file)
          formData.append('category', selectedCategory)
          if (patientId) {
            formData.append('patientId', patientId)
          }

          // Upload with progress tracking
          const response = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })

          if (!response.ok) {
            throw new Error('Upload failed')
          }

          const result = await response.json()

          // Update status to success
          setFiles(prev => prev.map(f => 
            f.id === photoFile.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          ))

          completedCount++
          onUploadProgress?.(completedCount / validFiles.length * 100)

          return result
        } catch (error) {
          // Update status to error
          setFiles(prev => prev.map(f => 
            f.id === photoFile.id 
              ? { ...f, status: 'error', error: 'Αποτυχία μεταφόρτωσης' }
              : f
          ))
          throw error
        }
      })

      const results = await Promise.allSettled(uploadPromises)
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value)

      if (successful.length > 0) {
        toast.success(`${successful.length} φωτογραφίες μεταφορτώθηκαν επιτυχώς`)
        onUploadComplete?.(successful)
      }

      const failed = results.filter(result => result.status === 'rejected').length
      if (failed > 0) {
        toast.error(`${failed} φωτογραφίες απέτυχαν να μεταφορτωθούν`)
      }

    } catch (error) {
      toast.error('Σφάλμα κατά τη μεταφόρτωση')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  // Clear completed files
  const clearCompleted = () => {
    setFiles(prev => {
      const toRemove = prev.filter(f => f.status === 'success')
      toRemove.forEach(f => URL.revokeObjectURL(f.preview))
      return prev.filter(f => f.status !== 'success')
    })
  }

  const pendingFiles = files.filter(f => f.status === 'pending')
  const hasValidFiles = pendingFiles.length > 0

  return (
    <div className={className}>
      <Card className={compact ? 'shadow-sm' : ''}>
        <CardBody padding={compact ? 'sm' : 'md'}>
          {/* Category Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Κατηγορία Φωτογραφιών
            </label>
            <Dropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value as string)}
              disabled={uploading}
            />
          </div>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary-400 bg-primary-50' 
                : uploading 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
              }
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            <div className="space-y-3">
              <div className="flex justify-center">
                {isDragActive ? (
                  <CloudArrowUpIcon className="h-12 w-12 text-primary-400" />
                ) : (
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isDragActive 
                    ? 'Αφήστε τις φωτογραφίες εδώ...' 
                    : 'Σύρετε φωτογραφίες εδώ ή κάντε κλικ για επιλογή'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Μέγιστο {maxFiles} αρχεία, έως {maxFileSize}MB το καθένα
                </p>
                <p className="text-xs text-gray-500">
                  Υποστηριζόμενοι τύποι: JPG, PNG, WebP
                </p>
              </div>

              {/* Camera Button */}
              {cameraSupported && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCameraCapture()
                    }}
                    leftIcon={<CameraIcon />}
                    disabled={uploading}
                  >
                    Λήψη από κάμερα
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Φωτογραφίες ({files.length})
                </h4>
                
                <div className="flex space-x-2">
                  {files.some(f => f.status === 'success') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCompleted}
                      disabled={uploading}
                    >
                      Εκκαθάριση ολοκληρωμένων
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {files.map((photoFile) => (
                    <motion.div
                      key={photoFile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {/* Preview */}
                      <img
                        src={photoFile.preview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg"
                      />

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {photoFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(photoFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        
                        {/* Progress Bar */}
                        {photoFile.status === 'uploading' && photoFile.progress !== undefined && (
                          <div className="mt-1">
                            <div className="bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${photoFile.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {photoFile.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {photoFile.error}
                          </p>
                        )}
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {photoFile.status === 'uploading' && (
                          <LoadingSpinner size="sm" />
                        )}
                        {photoFile.status === 'success' && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                        {photoFile.status === 'error' && (
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                        {photoFile.status === 'pending' && (
                          <button
                            onClick={() => removeFile(photoFile.id)}
                            className="text-gray-400 hover:text-red-500"
                            disabled={uploading}
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Upload Button */}
              {hasValidFiles && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={uploadFiles}
                    loading={uploading}
                    disabled={!hasValidFiles}
                    className="w-full sm:w-auto"
                  >
                    Μεταφόρτωση {pendingFiles.length} φωτογραφιών
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default PhotoUploader