import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  HeartIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Modal from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'

// API & Types
import { patientApi } from '@api/patientApi'
import { MedicalHistoryEntry, CreateMedicalHistoryEntry } from '@types/patient'

interface MedicalHistoryProps {
  patientId: string
}

interface MedicalHistoryFormData {
  category: 'allergy' | 'medication' | 'condition' | 'surgery' | 'other'
  title: string
  description: string
  date?: string
  severity?: 'low' | 'medium' | 'high'
  isActive: boolean
  notes?: string
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ patientId }) => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MedicalHistoryEntry | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<MedicalHistoryFormData>({
    defaultValues: {
      isActive: true,
      severity: 'medium'
    }
  })

  // API queries
  const { 
    data: medicalHistory, 
    isLoading, 
    error 
  } = useQuery(
    ['medical-history', patientId],
    () => patientApi.getMedicalHistory(patientId),
    {
      enabled: !!patientId
    }
  )

  // Mutations
  const createEntryMutation = useMutation(
    (data: CreateMedicalHistoryEntry) => patientApi.createMedicalHistoryEntry(patientId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['medical-history', patientId])
        toast.success('Η καταχώρηση προστέθηκε επιτυχώς')
        setIsModalOpen(false)
        reset()
      },
      onError: () => {
        toast.error('Σφάλμα κατά την προσθήκη της καταχώρησης')
      }
    }
  )

  const updateEntryMutation = useMutation(
    ({ entryId, data }: { entryId: string; data: Partial<MedicalHistoryEntry> }) =>
      patientApi.updateMedicalHistoryEntry(patientId, entryId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['medical-history', patientId])
        toast.success('Η καταχώρηση ενημερώθηκε επιτυχώς')
        setEditingEntry(null)
        setIsModalOpen(false)
        reset()
      },
      onError: () => {
        toast.error('Σφάλμα κατά την ενημέρωση της καταχώρησης')
      }
    }
  )

  const deleteEntryMutation = useMutation(
    (entryId: string) => patientApi.deleteMedicalHistoryEntry(patientId, entryId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['medical-history', patientId])
        toast.success('Η καταχώρηση διαγράφηκε επιτυχώς')
      },
      onError: () => {
        toast.error('Σφάλμα κατά τη διαγραφή της καταχώρησης')
      }
    }
  )

  // Handlers
  const handleAddEntry = () => {
    setEditingEntry(null)
    reset({
      isActive: true,
      severity: 'medium'
    })
    setIsModalOpen(true)
  }

  const handleEditEntry = (entry: MedicalHistoryEntry) => {
    setEditingEntry(entry)
    reset({
      category: entry.category,
      title: entry.title,
      description: entry.description,
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      severity: entry.severity,
      isActive: entry.isActive,
      notes: entry.notes
    })
    setIsModalOpen(true)
  }

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταχώρηση;')) {
      deleteEntryMutation.mutate(entryId)
    }
  }

  const onSubmit = (data: MedicalHistoryFormData) => {
    if (editingEntry) {
      updateEntryMutation.mutate({
        entryId: editingEntry.id,
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined
        }
      })
    } else {
      createEntryMutation.mutate({
        ...data,
        date: data.date ? new Date(data.date) : undefined
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'allergy':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'medication':
        return <HeartIcon className="h-5 w-5" />
      case 'condition':
        return <DocumentTextIcon className="h-5 w-5" />
      case 'surgery':
        return <ClockIcon className="h-5 w-5" />
      default:
        return <DocumentTextIcon className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'allergy':
        return 'text-red-600 bg-red-100'
      case 'medication':
        return 'text-blue-600 bg-blue-100'
      case 'condition':
        return 'text-yellow-600 bg-yellow-100'
      case 'surgery':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'allergy':
        return 'Αλλεργία'
      case 'medication':
        return 'Φάρμακο'
      case 'condition':
        return 'Κατάσταση'
      case 'surgery':
        return 'Εγχείρηση'
      default:
        return 'Άλλο'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'Υψηλή'
      case 'medium':
        return 'Μέτρια'
      case 'low':
        return 'Χαμηλή'
      default:
        return 'Μέτρια'
    }
  }

  const categoryOptions = [
    { value: 'allergy', label: 'Αλλεργία' },
    { value: 'medication', label: 'Φάρμακο' },
    { value: 'condition', label: 'Ιατρική Κατάσταση' },
    { value: 'surgery', label: 'Εγχείρηση' },
    { value: 'other', label: 'Άλλο' }
  ]

  const severityOptions = [
    { value: 'low', label: 'Χαμηλή' },
    { value: 'medium', label: 'Μέτρια' },
    { value: 'high', label: 'Υψηλή' }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-gray-500">Φόρτωση ιατρικού ιστορικού...</p>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-red-600">
          <p>Σφάλμα κατά τη φόρτωση του ιατρικού ιστορικού</p>
        </CardBody>
      </Card>
    )
  }

  const entries = medicalHistory || []
  const activeEntries = entries.filter(entry => entry.isActive)
  const inactiveEntries = entries.filter(entry => !entry.isActive)

  return (
    <>
      <Card>
        <CardHeader 
          title="Ιατρικό Ιστορικό"
          extra={
            <Button
              size="sm"
              onClick={handleAddEntry}
              leftIcon={<PlusIcon />}
            >
              Νέα Καταχώρηση
            </Button>
          }
        />
        <CardBody>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <HeartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Δεν υπάρχει ιατρικό ιστορικό
              </h3>
              <p className="text-gray-500 mb-4">
                Προσθέστε καταχωρήσεις για αλλεργίες, φάρμακα και ιατρικές καταστάσεις
              </p>
              <Button onClick={handleAddEntry} leftIcon={<PlusIcon />}>
                Προσθήκη πρώτης καταχώρησης
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Entries */}
              {activeEntries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Ενεργές Καταχωρήσεις ({activeEntries.length})
                  </h4>
                  <div className="space-y-3">
                    {activeEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${getCategoryColor(entry.category)}`}>
                              {getCategoryIcon(entry.category)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="text-sm font-medium text-gray-900">
                                  {entry.title}
                                </h5>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {getCategoryLabel(entry.category)}
                                </span>
                                {entry.severity && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityColor(entry.severity)}`}>
                                    {getSeverityLabel(entry.severity)}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {entry.description}
                              </p>
                              
                              {entry.date && (
                                <p className="text-xs text-gray-500">
                                  Ημερομηνία: {new Date(entry.date).toLocaleDateString('el-GR')}
                                </p>
                              )}
                              
                              {entry.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Σημειώσεις: {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive Entries */}
              {inactiveEntries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Παλαιές Καταχωρήσεις ({inactiveEntries.length})
                  </h4>
                  <div className="space-y-3">
                    {inactiveEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (activeEntries.length + index) * 0.1 }}
                        className="border border-gray-100 rounded-lg p-4 bg-gray-50 opacity-75"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 rounded-lg bg-gray-200 text-gray-500">
                              {getCategoryIcon(entry.category)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="text-sm font-medium text-gray-700 line-through">
                                  {entry.title}
                                </h5>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                                  {getCategoryLabel(entry.category)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-500 mb-2">
                                {entry.description}
                              </p>
                              
                              {entry.date && (
                                <p className="text-xs text-gray-400">
                                  Ημερομηνία: {new Date(entry.date).toLocaleDateString('el-GR')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEntry(null)
          reset()
        }}
        title={editingEntry ? 'Επεξεργασία Καταχώρησης' : 'Νέα Καταχώρηση Ιατρικού Ιστορικού'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Κατηγορία *
              </label>
              <select
                {...register('category', { required: 'Η κατηγορία είναι υποχρεωτική' })}
                className="form-select"
              >
                <option value="">Επιλογή κατηγορίας</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Σοβαρότητα
              </label>
              <select
                {...register('severity')}
                className="form-select"
              >
                {severityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Τίτλος"
            {...register('title', { required: 'Ο τίτλος είναι υποχρεωτικός' })}
            error={errors.title?.message}
            placeholder="π.χ. Αλλεργία στην πενικιλίνη"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Περιγραφή *
            </label>
            <textarea
              {...register('description', { required: 'Η περιγραφή είναι υποχρεωτική' })}
              rows={3}
              className="form-textarea"
              placeholder="Αναλυτική περιγραφή..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ημερομηνία"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                {...register('isActive')}
                className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label className="text-sm text-gray-700">
                Ενεργή καταχώρηση
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Σημειώσεις
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="form-textarea"
              placeholder="Πρόσθετες σημειώσεις..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingEntry(null)
                reset()
              }}
            >
              Ακύρωση
            </Button>
            
            <Button
              type="submit"
              loading={createEntryMutation.isLoading || updateEntryMutation.isLoading}
              disabled={!isValid}
            >
              {editingEntry ? 'Ενημέρωση' : 'Προσθήκη'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default MedicalHistory