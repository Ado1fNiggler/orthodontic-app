import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import {
  FolderIcon,
  PhotoIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  EyeIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Modal from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'
import PhotoGallery from './PhotoGallery'

// API & Types
import { photoApi } from '@api/photoApi'
import { Photo } from '@types/photo'

interface PhotoCategoriesProps {
  patientId?: string
  onCategorySelect?: (category: string) => void
  onPhotoSelect?: (photo: Photo) => void
  showStats?: boolean
  allowManagement?: boolean
  className?: string
}

interface PhotoCategory {
  id: string
  name: string
  displayName: string
  description?: string
  color: string
  icon: string
  count: number
  lastUpdate?: string
  totalSize: number
  isCustom: boolean
}

interface CategoryFormData {
  name: string
  displayName: string
  description: string
  color: string
  icon: string
}

const PhotoCategories: React.FC<PhotoCategoriesProps> = ({
  patientId,
  onCategorySelect,
  onPhotoSelect,
  showStats = true,
  allowManagement = false,
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PhotoCategory | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    icon: 'PhotoIcon'
  })

  // API Queries
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading,
    refetch: refetchCategories 
  } = useQuery(
    ['photo-categories', patientId],
    () => photoApi.getCategories({ patientId }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000
    }
  )

  const { 
    data: photosData, 
    isLoading: photosLoading 
  } = useQuery(
    ['photos-by-category', patientId, selectedCategory],
    () => selectedCategory ? photoApi.getPhotos({ 
      patientId, 
      category: selectedCategory,
      sortBy: 'date',
      sortOrder: 'desc'
    }) : null,
    {
      enabled: !!selectedCategory,
      keepPreviousData: true
    }
  )

  // Default categories
  const defaultCategories: Omit<PhotoCategory, 'count' | 'lastUpdate' | 'totalSize'>[] = [
    {
      id: 'clinical',
      name: 'clinical',
      displayName: 'Κλινικές',
      description: 'Γενικές κλινικές φωτογραφίες',
      color: '#3B82F6',
      icon: 'PhotoIcon',
      isCustom: false
    },
    {
      id: 'before',
      name: 'before',
      displayName: 'Πριν τη θεραπεία',
      description: 'Φωτογραφίες πριν την έναρξη της θεραπείας',
      color: '#EF4444',
      icon: 'ClockIcon',
      isCustom: false
    },
    {
      id: 'during',
      name: 'during',
      displayName: 'Κατά τη θεραπεία',
      description: 'Φωτογραφίες κατά τη διάρκεια της θεραπείας',
      color: '#F59E0B',
      icon: 'CalendarDaysIcon',
      isCustom: false
    },
    {
      id: 'after',
      name: 'after',
      displayName: 'Μετά τη θεραπεία',
      description: 'Φωτογραφίες μετά την ολοκλήρωση της θεραπείας',
      color: '#10B981',
      icon: 'CheckCircleIcon',
      isCustom: false
    },
    {
      id: 'xray',
      name: 'xray',
      displayName: 'Ακτινογραφίες',
      description: 'Ακτινολογικές εξετάσεις',
      color: '#6B7280',
      icon: 'DocumentIcon',
      isCustom: false
    },
    {
      id: 'intraoral',
      name: 'intraoral',
      displayName: 'Ενδοστοματικές',
      description: 'Φωτογραφίες εντός του στόματος',
      color: '#8B5CF6',
      icon: 'EyeIcon',
      isCustom: false
    },
    {
      id: 'extraoral',
      name: 'extraoral',
      displayName: 'Εξωστοματικές',
      description: 'Φωτογραφίες εκτός του στόματος',
      color: '#06B6D4',
      icon: 'FaceSmileIcon',
      isCustom: false
    },
    {
      id: 'other',
      name: 'other',
      displayName: 'Άλλες',
      description: 'Λοιπές φωτογραφίες',
      color: '#64748B',
      icon: 'FolderIcon',
      isCustom: false
    }
  ]

  // Merge default categories with API data
  const categories = useMemo(() => {
    const apiCategories = categoriesData?.categories || []
    
    return defaultCategories.map(defaultCat => {
      const apiCat = apiCategories.find(cat => cat.name === defaultCat.name)
      return {
        ...defaultCat,
        count: apiCat?.count || 0,
        lastUpdate: apiCat?.lastUpdate,
        totalSize: apiCat?.totalSize || 0
      }
    }).concat(
      apiCategories
        .filter(cat => cat.isCustom)
        .map(cat => ({ ...cat, id: cat.name }))
    )
  }, [categoriesData])

  // Handle category selection
  const handleCategorySelect = (category: PhotoCategory) => {
    setSelectedCategory(category.name)
    onCategorySelect?.(category.name)
  }

  // Handle category creation
  const handleCreateCategory = async () => {
    try {
      await photoApi.createCategory({
        ...formData,
        isCustom: true
      })
      setIsCreateModalOpen(false)
      setFormData({
        name: '',
        displayName: '',
        description: '',
        color: '#3B82F6',
        icon: 'PhotoIcon'
      })
      refetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  // Handle category edit
  const handleEditCategory = async () => {
    if (!editingCategory) return

    try {
      await photoApi.updateCategory(editingCategory.id, formData)
      setIsEditModalOpen(false)
      setEditingCategory(null)
      refetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  // Handle category deletion
  const handleDeleteCategory = async (category: PhotoCategory) => {
    if (!category.isCustom) return
    if (category.count > 0) {
      alert('Δεν μπορείτε να διαγράψετε κατηγορία που περιέχει φωτογραφίες')
      return
    }

    if (confirm(`Είστε βέβαιοι ότι θέλετε να διαγράψετε την κατηγορία "${category.displayName}";`)) {
      try {
        await photoApi.deleteCategory(category.id)
        refetchCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  // Open edit modal
  const openEditModal = (category: PhotoCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      displayName: category.displayName,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    })
    setIsEditModalOpen(true)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ποτέ'
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Color options for categories
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'
  ]

  // Icon options
  const iconOptions = [
    'PhotoIcon', 'FolderIcon', 'TagIcon', 'ClockIcon',
    'CalendarDaysIcon', 'EyeIcon', 'DocumentIcon', 'ChartBarIcon'
  ]

  if (categoriesLoading) {
    return (
      <Card className={className}>
        <CardBody className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Φόρτωση κατηγοριών...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={className}>
      {selectedCategory ? (
        // Photo gallery for selected category
        <div>
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className="text-primary-600 hover:text-primary-700"
            >
              ← Επιστροφή στις κατηγορίες
            </Button>
            
            <h2 className="text-lg font-medium text-gray-900">
              {categories.find(c => c.name === selectedCategory)?.displayName}
            </h2>
          </div>

          <PhotoGallery
            patientId={patientId}
            category={selectedCategory}
            onPhotoSelect={onPhotoSelect}
            showFilters={false}
          />
        </div>
      ) : (
        // Categories grid
        <Card>
          <CardHeader
            title="Κατηγορίες Φωτογραφιών"
            extra={
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded text-sm ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-primary-600' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded text-sm ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-primary-600' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    List
                  </button>
                </div>

                {allowManagement && (
                  <Button
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    leftIcon={<PlusIcon />}
                  >
                    Νέα κατηγορία
                  </Button>
                )}
              </div>
            }
          />

          <CardBody>
            {viewMode === 'grid' ? (
              // Grid view
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div
                      onClick={() => handleCategorySelect(category)}
                      className="relative p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
                      style={{ borderColor: category.color + '20' }}
                    >
                      {/* Category Icon */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <PhotoIcon 
                          className="h-6 w-6" 
                          style={{ color: category.color }} 
                        />
                      </div>

                      {/* Category Info */}
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {category.displayName}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {category.count} φωτογραφίες
                        </p>
                        {showStats && (
                          <p className="text-xs text-gray-400">
                            {formatFileSize(category.totalSize)}
                          </p>
                        )}
                      </div>

                      {/* Actions (for custom categories) */}
                      {allowManagement && category.isCustom && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(category)
                              }}
                              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                            >
                              <PencilIcon className="h-3 w-3 text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCategory(category)
                              }}
                              className="p-1 bg-white rounded shadow-sm hover:bg-red-50"
                            >
                              <TrashIcon className="h-3 w-3 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Updated indicator */}
                      {category.lastUpdate && (
                        <div className="absolute bottom-2 left-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // List view
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => handleCategorySelect(category)}
                  >
                    {/* Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      <PhotoIcon 
                        className="h-5 w-5" 
                        style={{ color: category.color }} 
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {category.displayName}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{category.count} φωτογραφίες</span>
                          {showStats && (
                            <>
                              <span>{formatFileSize(category.totalSize)}</span>
                              <span>Ενημ.: {formatDate(category.lastUpdate)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {category.description}
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
                          handleCategorySelect(category)
                        }}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {allowManagement && category.isCustom && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(category)
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCategory(category)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Stats Summary */}
            {showStats && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {categories.reduce((sum, cat) => sum + cat.count, 0)}
                    </div>
                    <div className="text-xs text-gray-500">Συνολικές φωτογραφίες</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {categories.length}
                    </div>
                    <div className="text-xs text-gray-500">Κατηγορίες</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatFileSize(categories.reduce((sum, cat) => sum + cat.totalSize, 0))}
                    </div>
                    <div className="text-xs text-gray-500">Συνολικό μέγεθος</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {categories.filter(cat => cat.isCustom).length}
                    </div>
                    <div className="text-xs text-gray-500">Προσαρμοσμένες</div>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Δημιουργία νέας κατηγορίας"
      >
        <div className="space-y-4">
          <Input
            label="Όνομα κατηγορίας"
            placeholder="π.χ. custom-category"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />

          <Input
            label="Εμφανιζόμενο όνομα"
            placeholder="π.χ. Προσαρμοσμένη κατηγορία"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          />

          <Input
            label="Περιγραφή"
            placeholder="Περιγραφή της κατηγορίας"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Χρώμα
            </label>
            <div className="flex space-x-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.color === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!formData.name || !formData.displayName}
            >
              Δημιουργία
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Επεξεργασία κατηγορίας"
      >
        <div className="space-y-4">
          <Input
            label="Εμφανιζόμενο όνομα"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          />

          <Input
            label="Περιγραφή"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Χρώμα
            </label>
            <div className="flex space-x-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.color === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Ακύρωση
            </Button>
            <Button onClick={handleEditCategory}>
              Αποθήκευση
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PhotoCategories