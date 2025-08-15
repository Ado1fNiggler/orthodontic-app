import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  InformationCircleIcon,
  RotateIcon
} from '@heroicons/react/24/outline'

// Components
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'

// Types
import { Photo } from '@types/photo'

interface PhotoViewerProps {
  photo: Photo
  photos?: Photo[]
  isOpen: boolean
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  onDelete?: (photo: Photo) => void
  onEdit?: (photo: Photo) => void
  showThumbnails?: boolean
  showInfo?: boolean
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photo,
  photos = [],
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onDelete,
  onEdit,
  showThumbnails = true,
  showInfo = true
}) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Reset state when photo changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    setIsDragging(false)
  }, [photo.id])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onPrevious?.()
          break
        case 'ArrowRight':
          onNext?.()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          resetZoom()
          break
        case 'r':
        case 'R':
          handleRotate()
          break
        case 'i':
        case 'I':
          setShowInfoPanel(!showInfoPanel)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showInfoPanel, onClose, onNext, onPrevious])

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls])

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true)
  }

  // Zoom functions
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1))
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Rotation
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle image dragging
  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setPosition(prev => ({
      x: prev.x + info.delta.x,
      y: prev.y + info.delta.y
    }))
  }

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)))
  }

  // Download photo
  const handleDownload = async () => {
    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename || `photo-${photo.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // Share photo
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title || photo.filename,
          text: photo.description,
          url: photo.url
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(photo.url)
    }
  }

  const currentIndex = photos.findIndex(p => p.id === photo.id)
  const hasMultiplePhotos = photos.length > 1

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
          onMouseMove={handleMouseMove}
          ref={containerRef}
        >
          {/* Top Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4"
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Info */}
                  <div className="flex items-center space-x-4 text-white">
                    <h2 className="text-lg font-medium truncate max-w-xs">
                      {photo.title || photo.filename}
                    </h2>
                    {hasMultiplePhotos && (
                      <span className="text-sm text-gray-300">
                        {currentIndex + 1} / {photos.length}
                      </span>
                    )}
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInfoPanel(!showInfoPanel)}
                      className="text-white hover:bg-white/20"
                    >
                      <InformationCircleIcon className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="text-white hover:bg-white/20"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="text-white hover:bg-white/20"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </Button>

                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(photo)}
                        className="text-white hover:bg-white/20"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Button>
                    )}

                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(photo)}
                        className="text-white hover:bg-red-500/20"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <ArrowsPointingOutIcon className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-white hover:bg-white/20"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Image Container */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            onWheel={handleWheel}
          >
            <motion.img
              ref={imageRef}
              src={photo.url}
              alt={photo.title || photo.filename}
              className="max-w-none cursor-move select-none"
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
              animate={{
                scale,
                x: position.x,
                y: position.y,
              }}
              drag
              dragConstraints={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              dragElastic={0.1}
              transition={{ type: "spring", damping: 50, stiffness: 400 }}
            />
          </div>

          {/* Navigation Controls */}
          {hasMultiplePhotos && (
            <>
              {/* Previous Button */}
              <AnimatePresence>
                {showControls && onPrevious && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                  >
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={onPrevious}
                      className="text-white hover:bg-white/20 rounded-full p-3"
                    >
                      <ChevronLeftIcon className="h-8 w-8" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Button */}
              <AnimatePresence>
                {showControls && onNext && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                  >
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={onNext}
                      className="text-white hover:bg-white/20 rounded-full p-3"
                    >
                      <ChevronRightIcon className="h-8 w-8" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Bottom Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4"
              >
                <div className="flex items-center justify-center space-x-4">
                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-2 bg-black/50 rounded-lg p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      className="text-white hover:bg-white/20"
                    >
                      <MagnifyingGlassMinusIcon className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-white text-sm min-w-[3rem] text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      className="text-white hover:bg-white/20"
                    >
                      <MagnifyingGlassPlusIcon className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetZoom}
                      className="text-white hover:bg-white/20 text-xs"
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Rotate */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRotate}
                    className="text-white hover:bg-white/20 bg-black/50 rounded-lg p-2"
                  >
                    <RotateIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Thumbnails */}
                {showThumbnails && hasMultiplePhotos && (
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-2 bg-black/50 rounded-lg p-2 max-w-full overflow-x-auto">
                      {photos.map((p, index) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (index < currentIndex && onPrevious) {
                              for (let i = 0; i < currentIndex - index; i++) {
                                onPrevious()
                              }
                            } else if (index > currentIndex && onNext) {
                              for (let i = 0; i < index - currentIndex; i++) {
                                onNext()
                              }
                            }
                          }}
                          className={`
                            w-12 h-12 rounded overflow-hidden border-2 transition-all
                            ${p.id === photo.id 
                              ? 'border-white' 
                              : 'border-transparent hover:border-gray-400'
                            }
                          `}
                        >
                          <img
                            src={p.thumbnailUrl || p.url}
                            alt={p.title || p.filename}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Panel */}
          <AnimatePresence>
            {showInfoPanel && showInfo && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-0 right-0 bottom-0 w-80 bg-black/90 backdrop-blur-sm border-l border-white/20 z-20 overflow-y-auto"
              >
                <div className="p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium">Πληροφορίες Φωτογραφίας</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInfoPanel(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-300">Όνομα αρχείου</dt>
                      <dd className="text-sm text-white mt-1">{photo.filename}</dd>
                    </div>

                    {photo.title && (
                      <div>
                        <dt className="text-sm font-medium text-gray-300">Τίτλος</dt>
                        <dd className="text-sm text-white mt-1">{photo.title}</dd>
                      </div>
                    )}

                    {photo.description && (
                      <div>
                        <dt className="text-sm font-medium text-gray-300">Περιγραφή</dt>
                        <dd className="text-sm text-white mt-1">{photo.description}</dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-sm font-medium text-gray-300">Κατηγορία</dt>
                      <dd className="text-sm text-white mt-1">{photo.category}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-300">Μέγεθος αρχείου</dt>
                      <dd className="text-sm text-white mt-1">{formatFileSize(photo.fileSize)}</dd>
                    </div>

                    {photo.dimensions && (
                      <div>
                        <dt className="text-sm font-medium text-gray-300">Διαστάσεις</dt>
                        <dd className="text-sm text-white mt-1">
                          {photo.dimensions.width} × {photo.dimensions.height} pixels
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-sm font-medium text-gray-300">Ημερομηνία λήψης</dt>
                      <dd className="text-sm text-white mt-1">{formatDate(photo.createdAt)}</dd>
                    </div>

                    {photo.tags && photo.tags.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-300">Ετικέτες</dt>
                        <dd className="mt-1">
                          <div className="flex flex-wrap gap-1">
                            {photo.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white/20 text-white rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                    )}

                    {photo.metadata && (
                      <div>
                        <dt className="text-sm font-medium text-gray-300">Μεταδεδομένα</dt>
                        <dd className="text-xs text-gray-400 mt-1 space-y-1">
                          {Object.entries(photo.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keyboard Shortcuts Help */}
          <div className="absolute bottom-4 left-4 text-xs text-white/60 space-y-1">
            <div>← → Περιήγηση</div>
            <div>+ - Zoom</div>
            <div>R Περιστροφή</div>
            <div>I Πληροφορίες</div>
            <div>F Πλήρης οθόνη</div>
            <div>Esc Κλείσιμο</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PhotoViewer