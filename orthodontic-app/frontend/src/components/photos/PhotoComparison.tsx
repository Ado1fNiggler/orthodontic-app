import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PhotoIcon,
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Dropdown from '@components/common/Dropdown'

// Types
import { Photo } from '@types/photo'

interface PhotoComparisonProps {
  beforePhoto: Photo | null
  afterPhoto: Photo | null
  onBeforePhotoSelect: () => void
  onAfterPhotoSelect: () => void
  showSlider?: boolean
  showDetails?: boolean
  showMagnifier?: boolean
  className?: string
}

interface ComparisonSettings {
  sliderPosition: number
  magnifierEnabled: boolean
  magnifierSize: number
  magnifierZoom: number
  showGrid: boolean
  showLabels: boolean
}

const PhotoComparison: React.FC<PhotoComparisonProps> = ({
  beforePhoto,
  afterPhoto,
  onBeforePhotoSelect,
  onAfterPhotoSelect,
  showSlider = true,
  showDetails = true,
  showMagnifier = false,
  className
}) => {
  const [settings, setSettings] = useState<ComparisonSettings>({
    sliderPosition: 50,
    magnifierEnabled: showMagnifier,
    magnifierSize: 150,
    magnifierZoom: 2,
    showGrid: false,
    showLabels: true
  })
  const [isDragging, setIsDragging] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const [showMagnifier, setShowMagnifier] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const beforeImageRef = useRef<HTMLImageElement>(null)
  const afterImageRef = useRef<HTMLImageElement>(null)

  // Handle slider drag
  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    
    setSettings(prev => ({ ...prev, sliderPosition: percentage }))
  }

  // Handle magnifier
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !settings.magnifierEnabled) return

    const rect = containerRef.current.getBoundingClientRect()
    setMagnifierPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseEnter = () => {
    if (settings.magnifierEnabled) {
      setShowMagnifier(true)
    }
  }

  const handleMouseLeave = () => {
    setShowMagnifier(false)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate time difference
  const getTimeDifference = () => {
    if (!beforePhoto || !afterPhoto) return null

    const beforeDate = new Date(beforePhoto.createdAt)
    const afterDate = new Date(afterPhoto.createdAt)
    const diffTime = Math.abs(afterDate.getTime() - beforeDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 ημέρα'
    if (diffDays < 30) return `${diffDays} ημέρες`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return months === 1 ? '1 μήνας' : `${months} μήνες`
    }
    const years = Math.floor(diffDays / 365)
    return years === 1 ? '1 χρόνος' : `${years} χρόνια`
  }

  const hasPhotos = beforePhoto && afterPhoto
  const timeDifference = getTimeDifference()

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Σύγκριση Φωτογραφιών"
          extra={
            <div className="flex items-center space-x-2">
              {hasPhotos && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({ 
                      ...prev, 
                      magnifierEnabled: !prev.magnifierEnabled 
                    }))}
                    className={settings.magnifierEnabled ? 'text-primary-600' : ''}
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({ 
                      ...prev, 
                      showGrid: !prev.showGrid 
                    }))}
                    className={settings.showGrid ? 'text-primary-600' : ''}
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          }
        />

        <CardBody>
          {!hasPhotos ? (
            // Empty state
            <div className="text-center py-12">
              <div className="flex justify-center space-x-8 mb-6">
                <div 
                  onClick={onBeforePhotoSelect}
                  className="flex flex-col items-center space-y-2 cursor-pointer group"
                >
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center group-hover:border-primary-400 group-hover:bg-primary-50 transition-colors">
                    <PhotoIcon className="h-12 w-12 text-gray-400 group-hover:text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Επιλογή φωτογραφίας "Πριν"
                  </span>
                </div>

                <div className="flex items-center">
                  <ArrowsRightLeftIcon className="h-8 w-8 text-gray-400" />
                </div>

                <div 
                  onClick={onAfterPhotoSelect}
                  className="flex flex-col items-center space-y-2 cursor-pointer group"
                >
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center group-hover:border-primary-400 group-hover:bg-primary-50 transition-colors">
                    <PhotoIcon className="h-12 w-12 text-gray-400 group-hover:text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Επιλογή φωτογραφίας "Μετά"
                  </span>
                </div>
              </div>
              
              <p className="text-gray-500">
                Επιλέξτε δύο φωτογραφίες για να τις συγκρίνετε
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparison Info */}
              {showDetails && timeDifference && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-primary-700">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        <span>Διαφορά χρόνου: {timeDifference}</span>
                      </div>
                      <div className="flex items-center text-sm text-primary-700">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>
                          {formatDate(beforePhoto.createdAt)} → {formatDate(afterPhoto.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBeforePhotoSelect}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Αλλαγή "Πριν"
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAfterPhotoSelect}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Αλλαγή "Μετά"
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Container */}
              <div 
                ref={containerRef}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Before Image */}
                <div 
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - settings.sliderPosition}% 0 0)` }}
                >
                  <img
                    ref={beforeImageRef}
                    src={beforePhoto.url}
                    alt={beforePhoto.title || 'Πριν'}
                    className="w-full h-full object-cover"
                  />
                  {settings.showLabels && (
                    <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-medium">
                      Πριν
                    </div>
                  )}
                </div>

                {/* After Image */}
                <div 
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 0 0 ${settings.sliderPosition}%)` }}
                >
                  <img
                    ref={afterImageRef}
                    src={afterPhoto.url}
                    alt={afterPhoto.title || 'Μετά'}
                    className="w-full h-full object-cover"
                  />
                  {settings.showLabels && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-medium">
                      Μετά
                    </div>
                  )}
                </div>

                {/* Grid Overlay */}
                {settings.showGrid && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                )}

                {/* Slider */}
                {showSlider && (
                  <div 
                    className="absolute inset-y-0 w-0.5 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${settings.sliderPosition}%` }}
                    onMouseDown={() => setIsDragging(true)}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowsRightLeftIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                )}

                {/* Magnifier */}
                {showMagnifier && settings.magnifierEnabled && (
                  <div
                    className="absolute pointer-events-none border-2 border-white rounded-full shadow-lg overflow-hidden bg-white"
                    style={{
                      width: settings.magnifierSize,
                      height: settings.magnifierSize,
                      left: magnifierPosition.x - settings.magnifierSize / 2,
                      top: magnifierPosition.y - settings.magnifierSize / 2,
                      zIndex: 10
                    }}
                  >
                    {/* Before magnified view */}
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        clipPath: `inset(0 ${100 - settings.sliderPosition}% 0 0)`,
                        backgroundImage: `url(${beforePhoto.url})`,
                        backgroundSize: `${containerRef.current?.offsetWidth * settings.magnifierZoom}px ${containerRef.current?.offsetHeight * settings.magnifierZoom}px`,
                        backgroundPosition: `-${(magnifierPosition.x - settings.magnifierSize / 2) * settings.magnifierZoom}px -${(magnifierPosition.y - settings.magnifierSize / 2) * settings.magnifierZoom}px`,
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    
                    {/* After magnified view */}
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        clipPath: `inset(0 0 0 ${settings.sliderPosition}%)`,
                        backgroundImage: `url(${afterPhoto.url})`,
                        backgroundSize: `${containerRef.current?.offsetWidth * settings.magnifierZoom}px ${containerRef.current?.offsetHeight * settings.magnifierZoom}px`,
                        backgroundPosition: `-${(magnifierPosition.x - settings.magnifierSize / 2) * settings.magnifierZoom}px -${(magnifierPosition.y - settings.magnifierSize / 2) * settings.magnifierZoom}px`,
                        backgroundRepeat: 'no-repeat'
                      }}
                    />

                    {/* Magnifier crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 opacity-50" />
                      <div className="absolute w-0.5 h-full bg-red-500 opacity-50" />
                    </div>
                  </div>
                )}

                {/* Mouse move handler for slider */}
                {isDragging && (
                  <div
                    className="absolute inset-0 cursor-ew-resize"
                    onMouseMove={handleSliderMove}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Διαχωριστής:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sliderPosition}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        sliderPosition: parseFloat(e.target.value) 
                      }))}
                      className="w-32"
                    />
                    <span className="text-xs text-gray-500 w-10">
                      {Math.round(settings.sliderPosition)}%
                    </span>
                  </div>

                  {settings.magnifierEnabled && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Zoom:</span>
                      <input
                        type="range"
                        min="1.5"
                        max="4"
                        step="0.1"
                        value={settings.magnifierZoom}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          magnifierZoom: parseFloat(e.target.value) 
                        }))}
                        className="w-20"
                      />
                      <span className="text-xs text-gray-500 w-8">
                        {settings.magnifierZoom.toFixed(1)}x
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettings(prev => ({ 
                      ...prev, 
                      showLabels: !prev.showLabels 
                    }))}
                    className={settings.showLabels ? 'text-primary-600' : ''}
                  >
                    Ετικέτες
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings(prev => ({ 
                      ...prev, 
                      sliderPosition: 50 
                    }))}
                  >
                    Επαναφορά
                  </Button>
                </div>
              </div>

              {/* Photo Details */}
              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Photo Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Φωτογραφία "Πριν"
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Αρχείο:</span>
                        <span className="text-gray-900">{beforePhoto.filename}</span>
                      </div>
                      {beforePhoto.title && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Τίτλος:</span>
                          <span className="text-gray-900">{beforePhoto.title}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Κατηγορία:</span>
                        <span className="text-gray-900">{beforePhoto.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ημερομηνία:</span>
                        <span className="text-gray-900">{formatDate(beforePhoto.createdAt)}</span>
                      </div>
                      {beforePhoto.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Διαστάσεις:</span>
                          <span className="text-gray-900">
                            {beforePhoto.dimensions.width} × {beforePhoto.dimensions.height}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After Photo Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Φωτογραφία "Μετά"
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Αρχείο:</span>
                        <span className="text-gray-900">{afterPhoto.filename}</span>
                      </div>
                      {afterPhoto.title && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Τίτλος:</span>
                          <span className="text-gray-900">{afterPhoto.title}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Κατηγορία:</span>
                        <span className="text-gray-900">{afterPhoto.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ημερομηνία:</span>
                        <span className="text-gray-900">{formatDate(afterPhoto.createdAt)}</span>
                      </div>
                      {afterPhoto.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Διαστάσεις:</span>
                          <span className="text-gray-900">
                            {afterPhoto.dimensions.width} × {afterPhoto.dimensions.height}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default PhotoComparison