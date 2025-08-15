/**
 * Clinical Notes Component for Orthodontic App
 * Location: frontend/src/components/orthodontic/ClinicalNotes.tsx
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal from '@components/common/Modal'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import LoadingSpinner from '@components/common/LoadingSpinner'

// Types
interface ClinicalNote {
  id: string
  patientId: string
  visitId?: string
  type: 'examination' | 'treatment' | 'consultation' | 'follow-up' | 'emergency' | 'general'
  category: 'diagnosis' | 'treatment-plan' | 'procedure' | 'observation' | 'instruction' | 'other'
  title: string
  content: string
  tags: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'draft' | 'final' | 'reviewed' | 'archived'
  createdAt: string
  updatedAt: string
  createdBy: string
  reviewedBy?: string
  reviewedAt?: string
  attachments?: string[]
  relatedNotes?: string[]
  isPrivate: boolean
  template?: string
}

interface NoteTemplate {
  id: string
  name: string
  category: string
  content: string
  tags: string[]
  isActive: boolean
}

interface ClinicalNotesProps {
  patientId: string
  visitId?: string
  notes?: ClinicalNote[]
  templates?: NoteTemplate[]
  onNoteAdd?: (note: ClinicalNote) => void
  onNoteUpdate?: (note: ClinicalNote) => void
  onNoteDelete?: (noteId: string) => void
  readonly?: boolean
  allowTemplates?: boolean
  className?: string
}

const ClinicalNotes: React.FC<ClinicalNotesProps> = ({
  patientId,
  visitId,
  notes = [],
  templates = [],
  onNoteAdd,
  onNoteUpdate,
  onNoteDelete,
  readonly = false,
  allowTemplates = true,
  className
}) => {
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Note type options
  const typeOptions = [
    { label: 'Όλοι οι τύποι', value: 'all' },
    { label: 'Εξέταση', value: 'examination' },
    { label: 'Θεραπεία', value: 'treatment' },
    { label: 'Συμβουλευτική', value: 'consultation' },
    { label: 'Παρακολούθηση', value: 'follow-up' },
    { label: 'Επείγον', value: 'emergency' },
    { label: 'Γενικά', value: 'general' }
  ]

  const categoryOptions = [
    { label: 'Όλες οι κατηγορίες', value: 'all' },
    { label: 'Διάγνωση', value: 'diagnosis' },
    { label: 'Σχέδιο θεραπείας', value: 'treatment-plan' },
    { label: 'Διαδικασία', value: 'procedure' },
    { label: 'Παρατήρηση', value: 'observation' },
    { label: 'Οδηγίες', value: 'instruction' },
    { label: 'Άλλο', value: 'other' }
  ]

  const priorityOptions = [
    { label: 'Όλες οι προτεραιότητες', value: 'all' },
    { label: 'Χαμηλή', value: 'low' },
    { label: 'Κανονική', value: 'normal' },
    { label: 'Υψηλή', value: 'high' },
    { label: 'Επείγουσα', value: 'urgent' }
  ]

  const statusOptions = [
    { label: 'Πρόχειρο', value: 'draft' },
    { label: 'Οριστικό', value: 'final' },
    { label: 'Αναθεωρημένο', value: 'reviewed' },
    { label: 'Αρχειοθετημένο', value: 'archived' }
  ]

  // Default templates
  const defaultTemplates: NoteTemplate[] = [
    {
      id: 'exam-initial',
      name: 'Αρχική εξέταση',
      category: 'examination',
      content: `ΑΡΧΙΚΗ ΟΡΘΟΔΟΝΤΙΚΗ ΕΞΕΤΑΣΗ

Λόγος επίσκεψης:
- 

Ιστορικό:
- Οδοντιατρικό ιστορικό:
- Ορθοδοντικό ιστορικό:
- Οικογενειακό ιστορικό:

Κλινική εξέταση:
- Εξωστοματική εξέταση:
- Ενδοστοματική εξέταση:
- Οκκλειακή ανάλυση:

Διάγνωση:
- 

Σχέδιο θεραπείας:
- `,
      tags: ['αρχική', 'εξέταση', 'διάγνωση'],
      isActive: true
    }
  ]

  const allTemplates = [...defaultTemplates, ...templates]

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }

      // Type filter
      if (filterType !== 'all' && note.type !== filterType) return false

      // Category filter
      if (filterCategory !== 'all' && note.category !== filterCategory) return false

      // Priority filter
      if (filterPriority !== 'all' && note.priority !== filterPriority) return false

      return true
    })

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [notes, searchTerm, filterType, filterCategory, filterPriority, sortBy, sortOrder])

  // Handle note operations
  const handleAddNote = (template?: NoteTemplate) => {
    const newNote: ClinicalNote = {
      id: `note-${Date.now()}`,
      patientId,
      visitId,
      type: template?.category as ClinicalNote['type'] || 'general',
      category: template?.category as ClinicalNote['category'] || 'other',
      title: template ? `${template.name} - ${new Date().toLocaleDateString('el-GR')}` : '',
      content: template?.content || '',
      tags: template?.tags || [],
      priority: 'normal',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user', // Should come from auth context
      isPrivate: false,
      template: template?.id
    }

    setSelectedNote(newNote)
    setIsNoteModalOpen(true)
  }

  const handleEditNote = (note: ClinicalNote) => {
    setSelectedNote(note)
    setIsNoteModalOpen(true)
  }

  const handleSaveNote = (note: ClinicalNote) => {
    if (notes.find(n => n.id === note.id)) {
      onNoteUpdate?.(note)
    } else {
      onNoteAdd?.(note)
    }
    setIsNoteModalOpen(false)
    setSelectedNote(null)
  }

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτή τη σημείωση;')) {
      onNoteDelete?.(noteId)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-green-100 text-green-800 border-green-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'final': return 'bg-blue-100 text-blue-800'
      case 'reviewed': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader
          title="Κλινικές Σημειώσεις"
          extra={
            <div className="flex items-center space-x-3">
              {!readonly && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddNote()}
                    leftIcon={<PlusIcon />}
                  >
                    Νέα σημείωση
                  </Button>
                  
                  {allowTemplates && allTemplates.length > 0 && (
                    <Dropdown
                      options={[
                        { label: 'Από πρότυπο...', value: '' },
                        ...allTemplates.map(t => ({ label: t.name, value: t.id }))
                      ]}
                      value=""
                      onChange={(templateId) => {
                        const template = allTemplates.find(t => t.id === templateId)
                        if (template) handleAddNote(template)
                      }}
                      placeholder="Πρότυπα"
                      size="sm"
                    />
                  )}
                </div>
              )}
            </div>
          }
        />

        <CardBody>
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Αναζήτηση σημειώσεων..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon />}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Dropdown
                  options={typeOptions}
                  value={filterType}
                  onChange={setFilterType}
                  size="sm"
                />

                <Dropdown
                  options={categoryOptions}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  size="sm"
                />

                <Dropdown
                  options={priorityOptions}
                  value={filterPriority}
                  onChange={setFilterPriority}
                  size="sm"
                />

                <Dropdown
                  options={[
                    { label: 'Ημερομηνία', value: 'date' },
                    { label: 'Προτεραιότητα', value: 'priority' },
                    { label: 'Τύπος', value: 'type' }
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as any)}
                  size="sm"
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-600">{notes.length}</div>
                <div className="text-xs text-blue-600">Σύνολο σημειώσεων</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-yellow-600">
                  {notes.filter(n => n.status === 'draft').length}
                </div>
                <div className="text-xs text-yellow-600">Πρόχειρα</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-red-600">
                  {notes.filter(n => ['urgent', 'high'].includes(n.priority)).length}
                </div>
                <div className="text-xs text-red-600">Υψηλή προτεραιότητα</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-600">
                  {notes.filter(n => n.status === 'reviewed').length}
                </div>
                <div className="text-xs text-green-600">Αναθεωρημένα</div>
              </div>
            </div>

            {/* Notes List */}
            {filteredAndSortedNotes.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterPriority !== 'all'
                    ? 'Δεν βρέθηκαν σημειώσεις'
                    : 'Δεν υπάρχουν σημειώσεις'
                  }
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterPriority !== 'all'
                    ? 'Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης'
                    : 'Προσθέστε την πρώτη κλινική σημείωση για αυτόν τον ασθενή'
                  }
                </p>
                {!readonly && (!searchTerm && filterType === 'all' && filterCategory === 'all' && filterPriority === 'all') && (
                  <Button onClick={() => handleAddNote()}>
                    Προσθήκη πρώτης σημείωσης
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${getPriorityColor(note.priority)}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {note.title || 'Χωρίς τίτλο'}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(note.status)}`}>
                            {statusOptions.find(opt => opt.value === note.status)?.label}
                          </span>
                          {note.priority !== 'normal' && (
                            <span className="text-xs font-medium text-current">
                              {priorityOptions.find(opt => opt.value === note.priority)?.label}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <BookOpenIcon className="h-4 w-4 mr-1" />
                            {typeOptions.find(opt => opt.value === note.type)?.label}
                          </span>
                          <span className="flex items-center">
                            <TagIcon className="h-4 w-4 mr-1" />
                            {categoryOptions.find(opt => opt.value === note.category)?.label}
                          </span>
                          <span className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            {formatDate(note.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {note.createdBy}
                          </span>
                        </div>

                        {/* Content preview */}
                        <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                          {note.content || 'Χωρίς περιεχόμενο'}
                        </p>

                        {/* Tags */}
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {note.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Review info */}
                        {note.reviewedBy && note.reviewedAt && (
                          <div className="text-xs text-gray-500">
                            <CheckCircleIcon className="h-3 w-3 inline mr-1" />
                            Αναθεωρήθηκε από {note.reviewedBy} στις {formatDate(note.reviewedAt)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                        >
                          {readonly ? <DocumentTextIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
                        </Button>

                        {!readonly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Note Modal */}
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false)
            setSelectedNote(null)
          }}
          onSave={handleSaveNote}
          typeOptions={typeOptions.slice(1)} // Remove "all" option
          categoryOptions={categoryOptions.slice(1)} // Remove "all" option
          priorityOptions={priorityOptions.slice(1)} // Remove "all" option
          statusOptions={statusOptions}
          readonly={readonly}
        />
      )}
    </div>
  )
}

// Note Modal Component
interface NoteModalProps {
  note: ClinicalNote
  isOpen: boolean
  onClose: () => void
  onSave: (note: ClinicalNote) => void
  typeOptions: Array<{ label: string; value: string }>
  categoryOptions: Array<{ label: string; value: string }>
  priorityOptions: Array<{ label: string; value: string }>
  statusOptions: Array<{ label: string; value: string }>
  readonly: boolean
}

const NoteModal: React.FC<NoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onSave,
  typeOptions,
  categoryOptions,
  priorityOptions,
  statusOptions,
  readonly
}) => {
  const [formData, setFormData] = useState(note)
  const [newTag, setNewTag] = useState('')

  const handleSave = () => {
    const updatedNote = {
      ...formData,
      updatedAt: new Date().toISOString()
    }
    onSave(updatedNote)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formData.id.startsWith('note-') ? 'Νέα κλινική σημείωση' : 'Επεξεργασία σημείωσης'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Τίτλος"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            disabled={readonly}
            placeholder="Εισάγετε τίτλο σημείωσης..."
          />

          <Dropdown
            label="Κατάσταση"
            options={statusOptions}
            value={formData.status}
            onChange={(value) => setFormData(prev => ({ ...prev, status: value as ClinicalNote['status'] }))}
            disabled={readonly}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Dropdown
            label="Τύπος"
            options={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as ClinicalNote['type'] }))}
            disabled={readonly}
          />

          <Dropdown
            label="Κατηγορία"
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value as ClinicalNote['category'] }))}
            disabled={readonly}
          />

          <Dropdown
            label="Προτεραιότητα"
            options={priorityOptions}
            value={formData.priority}
            onChange={(value) => setFormData(prev => ({ ...prev, priority: value as ClinicalNote['priority'] }))}
            disabled={readonly}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Περιεχόμενο σημείωσης
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            disabled={readonly}
            placeholder="Εισάγετε το περιεχόμενο της σημείωσης..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ετικέτες
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {tag}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {!readonly && (
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Προσθήκη ετικέτας..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim()}
                size="sm"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Privacy Setting */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPrivate"
            checked={formData.isPrivate}
            onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
            disabled={readonly}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
            Ιδιωτική σημείωση (μόνο για τον δημιουργό)
          </label>
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Δημιουργήθηκε:</strong> {new Date(formData.createdAt).toLocaleString('el-GR')}
            </div>
            <div>
              <strong>Δημιουργός:</strong> {formData.createdBy}
            </div>
            {formData.updatedAt !== formData.createdAt && (
              <div>
                <strong>Τελευταία ενημέρωση:</strong> {new Date(formData.updatedAt).toLocaleString('el-GR')}
              </div>
            )}
            {formData.reviewedBy && formData.reviewedAt && (
              <div>
                <strong>Αναθεωρήθηκε:</strong> {formData.reviewedBy} ({new Date(formData.reviewedAt).toLocaleString('el-GR')})
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {readonly ? 'Κλείσιμο' : 'Ακύρωση'}
          </Button>
          {!readonly && (
            <Button onClick={handleSave} disabled={!formData.title.trim()}>
              Αποθήκευση
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ClinicalNotes
export type { ClinicalNote, NoteTemplate }
    },
    {
      id: 'treatment-progress',
      name: 'Πρόοδος θεραπείας',
      category: 'treatment',
      content: `ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΠΡΟΟΔΟΥ

Τρέχουσα φάση θεραπείας:
- 

Παρατηρήσεις:
- Κίνηση δοντιών:
- Συνεργασία ασθενή:
- Υγιεινή στόματος:

Επόμενα βήματα:
- 

Προγραμματισμός:
- Επόμενο ραντεβού:
- Αναμενόμενη διάρκεια φάσης:`,
      tags: ['πρόοδος', 'παρακολούθηση', 'θεραπεία'],
      isActive: true
    },
    {
      id: 'retention-check',
      name: 'Έλεγχος συγκράτησης',
      category: 'follow-up',
      content: `ΕΛΕΓΧΟΣ ΦΑΣΗΣ ΣΥΓΚΡΑΤΗΣΗΣ

Τύπος συγκρατήρα:
- Άνω αψίδα:
- Κάτω αψίδα:

Κατάσταση συγκρατήρων:
- Σταθερότητα:
- Υγιεινή:
- Συνεργασία ασθενή:

Σταθερότητα αποτελεσμάτων:
- Ευθυγράμμιση:
- Οκκλειακές επαφές:
- Υπερβολές:

Οδηγίες:
- 

Επόμενος έλεγχος:
- `,
      tags: ['συγκράτηση', 'έλεγχος', 'παρακολούθηση'],
      isActive: true