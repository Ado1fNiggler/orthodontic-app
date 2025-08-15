import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from 'react-query'
import {
  PhotoIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  TagIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardBody, CardHeader } from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import LoadingSpinner from '@components/common/LoadingSpinner'
import PhotoViewer from './PhotoViewer'

// API & Types
import { photoApi } from '@api/photoApi'
import { Photo } from '@types/photo'

interface PhotoGalleryProps {
  patientId?: string
  category?: string
  viewMode?: 'grid' | 'list' | 'timeline'
  selectable?: boolean
  onPhotoSelect?: (photo: Photo) => void
  onPhotosSelect?: (photos: Photo[]) => void
  className?: string
  showFilters?: boolean
  showStats?: boolean
}

interface PhotoFilters {
  search: string
  category: string
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  sortBy: 'date' | 'name' | 'size'
  sortOrder: 'asc' | 'desc'
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  patientId,
  category,
  viewMode = 'grid',
  selectable = false,
  onPhotoSelect,
  onPhotosSelect,
  className,
  showFilters = true,
  showStats = true
}) => {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null)
  const [filters, setFilters] = useState<PhotoFilters>({
    search: '',
    category: category || 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  // API Query
  const { 
    data: photosData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['photos', patientId, filters],
    () => photoApi.getPhotos({ patientId, ...filters }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000
    }
  )

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    if (!photosData?.photos) return []

    let filtered = [...photosData.photos]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.title?.toLowerCase().includes(searchLower) ||
        photo.description?.toLowerCase().includes(searchLower) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(photo => photo.category === filters.category)
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(photo => new Date(photo.createdAt) >= cutoffDate)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'name':
          comparison = (a.title || a.filename).localeCompare(b.title || b.filename)
          break
        case 'size':
          comparison = a.fileSize - b.fileSize
          break
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [photosData?.photos, filters])

  // Group photos by date for timeline view
  const groupedPhotos = useMemo(() => {
    if (currentViewMode !== 'timeline') return {}
    
    return filteredPhotos.reduce((groups, photo) => {
      const date = new Date(photo.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(photo)
      return groups
    }, {} as Record<string, Photo[]>)
  }, [filteredPhotos, currentViewMode])

  // Handle photo selection
  const handlePhotoClick = (photo: Photo, event: React.MouseEvent) => {
    if (selectable && event.ctrlKey) {
      // Multi-select with Ctrl+Click
      setSelectedPhotos(prev => {
        const newSelection = prev.includes(photo.id)
          ? prev.filter(id => id !== photo.id)
          : [...prev, photo.id]
        
        onPhotosSelect?.(filteredPhotos.filter(p => newSelection.includes(p.id)))
        return newSelection
      })
    } else if (selectable && selectedPhotos.length > 0) {
      // Single select when in selection mode
      setSelectedPhotos([photo.id])
      onPhotoSelect?.(photo)
    } else {
      // Open viewer
      setViewerPhoto(photo)
    }
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([])
      onPhotosSelect?.([])
    } else {
      const allIds = filteredPhotos.map(p => p.id)
      setSelectedPhotos(allIds)
      onPhotosSelect?.(filteredPhotos)
    }
  }

  // Filter options
  const categoryOptions = [
    { label: 'Όλες οι κατηγορίες', value: 'all' },
    { label: 'Κλινικές', value: 'clinical' },
    { label: 'Πριν τη θεραπεία', value: 'before' },
    { label: 'Κατά τη θεραπεία', value: 'during' },
    { label: 'Μετά τη θεραπεία', value: 'after' },
    { label: 'Ακτινογραφίες', value: 'xray' },
    { label: 'Ενδοστοματικές', value: 'intraoral' },
    { label: 'Εξωστοματικές', value: 'extraoral' },
    { label: 'Άλλες', value: 'other' }
  ]

  const dateRangeOptions = [
    { label: 'Όλες οι ημερομηνίες', value: 'all' },
    { label: 'Σήμερα', value: 'today' },
    { label: 'Τελευταία εβδομάδα', value: 'week' },
    { label: 'Τελευταίος μήνας', value: 'month' },
    { label: 'Τελευταίος χρόνος', value: 'year' }
  ]

  const sortOptions = [
    { label: 'Ημερομηνία', value: 'date' },
    { label: 'Όνομα', value: 'name' },
    { label: 'Μέγεθος', value: 'size' }
  ]

  const getCategoryLabel = (cat: string) => {
    const option = categoryOptions.find(opt => opt.value === cat)
    return option ? option.label : cat
  }

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

  if (error) {
    return (
      <Card className={className}>
        <CardBody className="text-center py-12">
          <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Σφάλμα φόρτωσης φωτογραφιών
          </h3>
          <p className="text-red-600 mb-4">
            Δεν ήταν δυνατή η φόρτωση των φωτογραφιών
          </p>
          <Button onClick={() => refetch()}>
            Δοκιμάστε ξανά
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        {/* Header */}
        <CardHeader 
          title={`Φωτογραφίες ${patientId ? 'Ασθενή' : ''}`}
          extra={
            <div className="flex items-center space-x-2">
              {/* View Mode Toggles */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentViewMode('grid')}
                  className={`p-1 rounded ${
                    currentViewMode === 'grid' 
                      ? 'bg-white shadow-sm text-primary-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentViewMode('list')}
                  className={`p-1 rounded ${
                    currentViewMode === 'list' 
                      ? 'bg-white shadow-sm text-primary-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentViewMode('timeline')}
                  className={`p-1 rounded ${
                    currentViewMode === 'timeline' 
                      ? 'bg-white shadow-sm text-primary-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Selection Controls */}
              {selectable && (
                <div className="flex items-center space-x-2">
                  {selectedPhotos.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedPhotos.length} επιλεγμένες
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPhotos.length === filteredPhotos.length ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
                  </Button>
                </div>
              )}
            </div>
          }
        />

        <CardBody>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Αναζήτηση φωτογραφιών..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  leftIcon={<MagnifyingGlassIcon />}
                />

                <Dropdown
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(value) => setFilters(prev => ({ ...prev, category: value as string }))}
                  placeholder="Κατηγορία"
                />

                <Dropdown
                  options={dateRangeOptions}
                  value={filters.dateRange}
                  onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                  placeholder="Περίοδος"
                />

                <div className="flex space-x-2">
                  <Dropdown
                    options={sortOptions}
                    value={filters.sortBy}
                    onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                    placeholder="Ταξινόμηση"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                    }))}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {showStats && photosData && (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {filteredPhotos.length}
                </div>
                <div className="text-xs text-gray-500">Φωτογραφίες</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {photosData.stats?.totalSize ? formatFileSize(photosData.stats.totalSize) : '0 MB'}
                </div>
                <div className="text-xs text-gray-500">Συνολικό μέγεθος</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {photosData.stats?.categories || 0}
                </div>
                <div className="text-xs text-gray-500">Κατηγορίες</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {photosData.stats?.lastUpload ? 
                    new Date(photosData.stats.lastUpload).toLocaleDateString('el-GR') : 
                    'Ποτέ'
                  }
                </div>
                <div className="text-xs text-gray-500">Τελευταία μεταφόρτωση</div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-500">Φόρτωση φωτογραφιών...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredPhotos.length === 0 && (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Δεν βρέθηκαν φωτογραφίες
              </h3>
              <p className="text-gray-500">
                {filters.search || filters.category !== 'all' || filters.dateRange !== 'all'
                  ? 'Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης'
                  : 'Μεταφορτώστε φωτογραφίες για να τις δείτε εδώ'
                }
              </p>
            </div>
          )}

          {/* Grid View */}
          {!isLoading && currentViewMode === 'grid' && filteredPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative group cursor-pointer rounded-lg overflow-hidden
                    ${selectedPhotos.includes(photo.id) 
                      ? 'ring-2 ring-primary-500 ring-offset-2' 
                      : 'hover:shadow-md'
                    }
                  `}
                  onClick={(e) => handlePhotoClick(photo, e)}
                >
                  <div className="aspect-square">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.title || photo.filename}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white bg-opacity-90 text-gray-900 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewerPhoto(photo)
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-black bg-opacity-60 text-white rounded-full">
                      {getCategoryLabel(photo.category)}
                    </span>
                  </div>

                  {/* Selection Checkbox */}
                  {selectable && (
                    <div className="absolute top-2 right-2">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${selectedPhotos.includes(photo.id)
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white bg-opacity-80 border-gray-300'
                        }
                      `}>
                        {selectedPhotos.includes(photo.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                    <p className="text-xs font-medium truncate">
                      {photo.title || photo.filename}
                    </p>
                    <p className="text-xs text-gray-300">
                      {formatDate(photo.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* List View */}
          {!isLoading && currentViewMode === 'list' && filteredPhotos.length > 0 && (
            <div className="space-y-3">
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center space-x-4 p-4 rounded-lg border cursor-pointer
                    ${selectedPhotos.includes(photo.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={(e) => handlePhotoClick(photo, e)}
                >
                  {/* Thumbnail */}
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.title || photo.filename}
                    className="w-16 h-16 object-cover rounded-lg"
                    loading="lazy"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {photo.title || photo.filename}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {getCategoryLabel(photo.category)} • {formatFileSize(photo.fileSize)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(photo.createdAt)}
                    </p>
                    {photo.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewerPhoto(photo)
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Timeline View */}
          {!isLoading && currentViewMode === 'timeline' && filteredPhotos.length > 0 && (
            <div className="space-y-8">
              {Object.entries(groupedPhotos)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, photos]) => (
                  <div key={date}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 mr-2" />
                      {new Date(date).toLocaleDateString('el-GR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      <span className="ml-2 text-sm text-gray-500">
                        ({photos.length} φωτογραφίες)
                      </span>
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {photos.map((photo, index) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group cursor-pointer rounded-lg overflow-hidden"
                          onClick={(e) => handlePhotoClick(photo, e)}
                        >
                          <div className="aspect-square">
                            <img
                              src={photo.thumbnailUrl || photo.url}
                              alt={photo.title || photo.filename}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity" />
                          
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded truncate block">
                              {new Date(photo.createdAt).toLocaleTimeString('el-GR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Photo Viewer Modal */}
      {viewerPhoto && (
        <PhotoViewer
          photo={viewerPhoto}
          photos={filteredPhotos}
          isOpen={!!viewerPhoto}
          onClose={() => setViewerPhoto(null)}
          onNext={() => {
            const currentIndex = filteredPhotos.findIndex(p => p.id === viewerPhoto.id)
            const nextIndex = (currentIndex + 1) % filteredPhotos.length
            setViewerPhoto(filteredPhotos[nextIndex])
          }}
          onPrevious={() => {
            const currentIndex = filteredPhotos.findIndex(p => p.id === viewerPhoto.id)
            const prevIndex = currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1
            setViewerPhoto(filteredPhotos[prevIndex])
          }}
        />
      )}
    </div>
  )
}

export default PhotoGallery