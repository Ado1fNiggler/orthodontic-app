import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import {
  CalendarDaysIcon,
  ClockIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Dropdown from '@components/common/Dropdown'
import LoadingSpinner from '@components/common/LoadingSpinner'
import PhotoViewer from './PhotoViewer'

// API & Types
import { photoApi } from '@api/photoApi'
import { Photo } from '@types/photo'

interface PhotoTimelineProps {
  patientId?: string
  category?: string
  dateRange?: 'week' | 'month' | 'year' | 'all'
  onPhotoSelect?: (photo: Photo) => void
  className?: string
  compact?: boolean
}

interface TimelineGroup {
  date: string
  displayDate: string
  photos: Photo[]
  isExpanded: boolean
}

interface TimelineFilters {
  category: string
  dateRange: 'week' | 'month' | 'year' | 'all'
  groupBy: 'day' | 'week' | 'month'
}

const PhotoTimeline: React.FC<PhotoTimelineProps> = ({
  patientId,
  category,
  dateRange = 'month',
  onPhotoSelect,
  className,
  compact = false
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<TimelineFilters>({
    category: category || 'all',
    dateRange,
    groupBy: 'day'
  })

  // API Query
  const { 
    data: photosData, 
    isLoading, 
    error 
  } = useQuery(
    ['photos-timeline', patientId, filters],
    () => photoApi.getPhotos({ 
      patientId, 
      category: filters.category !== 'all' ? filters.category : undefined,
      dateRange: filters.dateRange,
      sortBy: 'date',
      sortOrder: 'desc'
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000
    }
  )

  // Group photos by date
  const timelineGroups = useMemo(() => {
    if (!photosData?.photos) return []

    const groups: Record<string, Photo[]> = {}
    
    photosData.photos.forEach(photo => {
      const date = new Date(photo.createdAt)
      let groupKey: string
      let displayDate: string

      switch (filters.groupBy) {
        case 'day':
          groupKey = date.toDateString()
          displayDate = date.toLocaleDateString('el-GR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          groupKey = weekStart.toDateString()
          displayDate = `Εβδομάδα ${weekStart.toLocaleDateString('el-GR', {
            day: 'numeric',
            month: 'short'
          })}`
          break
        case 'month':
          groupKey = `${date.getFullYear()}-${date.getMonth()}`
          displayDate = date.toLocaleDateString('el-GR', {
            year: 'numeric',
            month: 'long'
          })
          break
        default:
          groupKey = date.toDateString()
          displayDate = date.toLocaleDateString('el-GR')
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(photo)
    })

    // Convert to timeline groups
    const timelineGroups: TimelineGroup[] = Object.entries(groups)
      .map(([date, photos]) => ({
        date,
        displayDate: groups[date] ? 
          Object.keys(groups).find(key => key === date) ? 
            Object.entries(groups).find(([key]) => key === date)?.[1]?.[0] ? 
              (() => {
                const firstPhoto = groups[date][0]
                const photoDate = new Date(firstPhoto.createdAt)
                
                switch (filters.groupBy) {
                  case 'day':
                    return photoDate.toLocaleDateString('el-GR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  case 'week':
                    const weekStart = new Date(photoDate)
                    weekStart.setDate(photoDate.getDate() - photoDate.getDay())
                    const weekEnd = new Date(weekStart)
                    weekEnd.setDate(weekStart.getDate() + 6)
                    return `${weekStart.toLocaleDateString('el-GR', {
                      day: 'numeric',
                      month: 'short'
                    })} - ${weekEnd.toLocaleDateString('el-GR', {
                      day: 'numeric',
                      month: 'short'
                    })}`
                  case 'month':
                    return photoDate.toLocaleDateString('el-GR', {
                      year: 'numeric',
                      month: 'long'
                    })
                  default:
                    return photoDate.toLocaleDateString('el-GR')
                }
              })() : date
            : date
          : date,
        photos: photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        isExpanded: expandedGroups.has(date)
      }))
      .sort((a, b) => new Date(b.photos[0].createdAt).getTime() - new Date(a.photos[0].createdAt).getTime())

    return timelineGroups
  }, [photosData?.photos, filters.groupBy, expandedGroups])

  // Toggle group expansion
  const toggleGroup = (groupDate: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupDate)) {
        newSet.delete(groupDate)
      } else {
        newSet.add(groupDate)
      }
      return newSet
    })
  }

  // Expand all groups
  const expandAll = () => {
    setExpandedGroups(new Set(timelineGroups.map(group => group.date)))
  }

  // Collapse all groups
  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  // Handle photo click
  const handlePhotoClick = (photo: Photo) => {
    if (onPhotoSelect) {
      onPhotoSelect(photo)
    } else {
      setSelectedPhoto(photo)
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
    { label: 'Τελευταία εβδομάδα', value: 'week' },
    { label: 'Τελευταίος μήνας', value: 'month' },
    { label: 'Τελευταίος χρόνος', value: 'year' },
    { label: 'Όλες οι ημερομηνίες', value: 'all' }
  ]

  const groupByOptions = [
    { label: 'Ανά ημέρα', value: 'day' },
    { label: 'Ανά εβδομάδα', value: 'week' },
    { label: 'Ανά μήνα', value: 'month' }
  ]

  const getCategoryLabel = (cat: string) => {
    const option = categoryOptions.find(opt => opt.value === cat)
    return option ? option.label : cat
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const allPhotos = timelineGroups.flatMap(group => group.photos)

  if (error) {
    return (
      <Card className={className}>
        <CardBody className="text-center py-12">
          <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Σφάλμα φόρτωσης timeline
          </h3>
          <p className="text-red-600">
            Δεν ήταν δυνατή η φόρτωση του timeline φωτογραφιών
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader 
          title="Timeline Φωτογραφιών"
          extra={
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                disabled={expandedGroups.size === timelineGroups.length}
              >
                Επέκταση όλων
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                disabled={expandedGroups.size === 0}
              >
                Σύμπτυξη όλων
              </Button>
            </div>
          }
        />

        <CardBody>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Dropdown
              options={groupByOptions}
              value={filters.groupBy}
              onChange={(value) => setFilters(prev => ({ ...prev, groupBy: value as any }))}
              placeholder="Ομαδοποίηση"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-500">Φόρτωση timeline...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && timelineGroups.length === 0 && (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Δεν βρέθηκαν φωτογραφίες
              </h3>
              <p className="text-gray-500">
                Δεν υπάρχουν φωτογραφίες για την επιλεγμένη περίοδο
              </p>
            </div>
          )}

          {/* Timeline */}
          {!isLoading && timelineGroups.length > 0 && (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {timelineGroups.map((group, groupIndex) => (
                  <motion.div
                    key={group.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline node */}
                    <div className="absolute left-4 w-4 h-4 bg-primary-600 rounded-full border-4 border-white shadow-sm" />

                    {/* Group header */}
                    <div className="ml-12 mb-4">
                      <button
                        onClick={() => toggleGroup(group.date)}
                        className="flex items-center space-x-2 text-left hover:text-primary-600 transition-colors group"
                      >
                        <h3 className="text-lg font-medium text-gray-900">
                          {group.displayDate}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({group.photos.length} φωτογραφίες)
                        </span>
                        {group.isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                        )}
                      </button>
                    </div>

                    {/* Photos grid */}
                    {group.isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-12 space-y-3"
                      >
                        {compact ? (
                          // Compact view - smaller thumbnails
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                            {group.photos.map((photo, photoIndex) => (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: photoIndex * 0.05 }}
                                className="relative group cursor-pointer"
                                onClick={() => handlePhotoClick(photo)}
                              >
                                <div className="aspect-square rounded-lg overflow-hidden">
                                  <img
                                    src={photo.thumbnailUrl || photo.url}
                                    alt={photo.title || photo.filename}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    loading="lazy"
                                  />
                                </div>
                                
                                {/* Time overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    {formatTime(photo.createdAt)}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          // Full view - larger cards with details
                          <div className="space-y-4">
                            {group.photos.map((photo, photoIndex) => (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: photoIndex * 0.1 }}
                                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => handlePhotoClick(photo)}
                              >
                                {/* Thumbnail */}
                                <div className="flex-shrink-0">
                                  <img
                                    src={photo.thumbnailUrl || photo.url}
                                    alt={photo.title || photo.filename}
                                    className="w-20 h-20 object-cover rounded-lg"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Photo details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {photo.title || photo.filename}
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {getCategoryLabel(photo.category)}
                                      </p>
                                      {photo.description && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                          {photo.description}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-4">
                                      <div className="flex items-center text-xs text-gray-500">
                                        <ClockIcon className="h-3 w-3 mr-1" />
                                        {formatTime(photo.createdAt)}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handlePhotoClick(photo)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <EyeIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Tags */}
                                  {photo.tags && photo.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {photo.tags.slice(0, 3).map((tag, tagIndex) => (
                                        <span
                                          key={tagIndex}
                                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {photo.tags.length > 3 && (
                                        <span className="text-xs text-gray-500">
                                          +{photo.tags.length - 3} ακόμη
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Photo Viewer */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          photos={allPhotos}
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => {
            const currentIndex = allPhotos.findIndex(p => p.id === selectedPhoto.id)
            const nextIndex = (currentIndex + 1) % allPhotos.length
            setSelectedPhoto(allPhotos[nextIndex])
          }}
          onPrevious={() => {
            const currentIndex = allPhotos.findIndex(p => p.id === selectedPhoto.id)
            const prevIndex = currentIndex === 0 ? allPhotos.length - 1 : currentIndex - 1
            setSelectedPhoto(allPhotos[prevIndex])
          }}
        />
      )}
    </div>
  )
}

export default PhotoTimeline