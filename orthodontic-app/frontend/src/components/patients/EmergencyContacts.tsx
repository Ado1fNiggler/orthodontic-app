import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import Modal, { ConfirmModal } from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'

// API & Types
import { patientApi } from '@api/patientApi'
import { EmergencyContact, CreateEmergencyContact } from '@types/patient'

interface EmergencyContactsProps {
  patientId: string
}

interface ContactFormData {
  name: string
  relationship: string
  phone: string
  email?: string
  address?: string
  isPrimary: boolean
  notes?: string
}

const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ patientId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contactId?: string }>({
    isOpen: false
  })
  const queryClient = useQueryClient()

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ContactFormData>({
    defaultValues: {
      isPrimary: false
    }
  })

  // API queries
  const { 
    data: contacts, 
    isLoading, 
    error 
  } = useQuery(
    ['emergency-contacts', patientId],
    () => patientApi.getEmergencyContacts(patientId),
    {
      enabled: !!patientId
    }
  )

  // Mutations
  const createContactMutation = useMutation(
    (data: CreateEmergencyContact) => patientApi.createEmergencyContact(patientId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emergency-contacts', patientId])
        toast.success('Η επαφή προστέθηκε επιτυχώς')
        setIsModalOpen(false)
        reset()
      },
      onError: () => {
        toast.error('Σφάλμα κατά την προσθήκη της επαφής')
      }
    }
  )

  const updateContactMutation = useMutation(
    ({ contactId, data }: { contactId: string; data: Partial<EmergencyContact> }) =>
      patientApi.updateEmergencyContact(patientId, contactId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emergency-contacts', patientId])
        toast.success('Η επαφή ενημερώθηκε επιτυχώς')
        setEditingContact(null)
        setIsModalOpen(false)
        reset()
      },
      onError: () => {
        toast.error('Σφάλμα κατά την ενημέρωση της επαφής')
      }
    }
  )

  const deleteContactMutation = useMutation(
    (contactId: string) => patientApi.deleteEmergencyContact(patientId, contactId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emergency-contacts', patientId])
        toast.success('Η επαφή διαγράφηκε επιτυχώς')
        setDeleteModal({ isOpen: false })
      },
      onError: () => {
        toast.error('Σφάλμα κατά τη διαγραφή της επαφής')
      }
    }
  )

  // Handlers
  const handleAddContact = () => {
    setEditingContact(null)
    reset({
      isPrimary: contacts?.length === 0 // First contact is primary by default
    })
    setIsModalOpen(true)
  }

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact)
    reset({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email || '',
      address: contact.address || '',
      isPrimary: contact.isPrimary,
      notes: contact.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteContact = (contactId: string) => {
    setDeleteModal({ isOpen: true, contactId })
  }

  const confirmDelete = () => {
    if (deleteModal.contactId) {
      deleteContactMutation.mutate(deleteModal.contactId)
    }
  }

  const onSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateContactMutation.mutate({
        contactId: editingContact.id,
        data
      })
    } else {
      createContactMutation.mutate(data)
    }
  }

  // Check if setting as primary would unset another primary contact
  const handlePrimaryChange = (isPrimary: boolean) => {
    if (isPrimary && contacts) {
      const currentPrimary = contacts.find(c => c.isPrimary && c.id !== editingContact?.id)
      if (currentPrimary) {
        const shouldProceed = window.confirm(
          `Υπάρχει ήδη κύρια επαφή (${currentPrimary.name}). Θέλετε να την αντικαταστήσετε;`
        )
        if (!shouldProceed) {
          return
        }
      }
    }
    setValue('isPrimary', isPrimary)
  }

  const relationshipOptions = [
    { label: 'Σύζυγος', value: 'spouse' },
    { label: 'Γονέας', value: 'parent' },
    { label: 'Παιδί', value: 'child' },
    { label: 'Αδελφός/ή', value: 'sibling' },
    { label: 'Παππούς/Γιαγιά', value: 'grandparent' },
    { label: 'Θείος/Θεία', value: 'uncle_aunt' },
    { label: 'Φίλος/η', value: 'friend' },
    { label: 'Γείτονας', value: 'neighbor' },
    { label: 'Εργοδότης', value: 'employer' },
    { label: 'Άλλο', value: 'other' }
  ]

  const getRelationshipLabel = (relationship: string) => {
    const option = relationshipOptions.find(opt => opt.value === relationship)
    return option ? option.label : relationship
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-gray-500">Φόρτωση επαφών έκτακτης ανάγκης...</p>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-red-600">
          <p>Σφάλμα κατά τη φόρτωση των επαφών έκτακτης ανάγκης</p>
        </CardBody>
      </Card>
    )
  }

  const contactsList = contacts || []
  const primaryContact = contactsList.find(contact => contact.isPrimary)

  return (
    <>
      <Card>
        <CardHeader 
          title="Επαφές Έκτακτης Ανάγκης"
          extra={
            <Button
              size="sm"
              onClick={handleAddContact}
              leftIcon={<PlusIcon />}
            >
              Νέα Επαφή
            </Button>
          }
        />
        <CardBody>
          {contactsList.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Δεν υπάρχουν επαφές έκτακτης ανάγκης
              </h3>
              <p className="text-gray-500 mb-4">
                Προσθέστε επαφές που μπορούν να ειδοποιηθούν σε περίπτωση έκτακτης ανάγκης
              </p>
              <Button onClick={handleAddContact} leftIcon={<PlusIcon />}>
                Προσθήκη πρώτης επαφής
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary Contact Warning */}
              {!primaryContact && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Δεν έχει οριστεί κύρια επαφή
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Συνιστάται να ορίσετε μία από τις επαφές ως κύρια επαφή έκτακτης ανάγκης.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts List */}
              {contactsList.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                    contact.isPrimary ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {contact.name}
                        </h4>
                        
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {getRelationshipLabel(contact.relationship)}
                        </span>
                        
                        {contact.isPrimary && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                            Κύρια επαφή
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          <a 
                            href={`tel:${contact.phone}`}
                            className="hover:text-primary-600 transition-colors"
                          >
                            {contact.phone}
                          </a>
                        </div>

                        {contact.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            <a 
                              href={`mailto:${contact.email}`}
                              className="hover:text-primary-600 transition-colors"
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}

                        {contact.address && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Διεύθυνση:</span> {contact.address}
                          </div>
                        )}

                        {contact.notes && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Σημειώσεις:</span> {contact.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditContact(contact)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingContact(null)
          reset()
        }}
        title={editingContact ? 'Επεξεργασία Επαφής' : 'Νέα Επαφή Έκτακτης Ανάγκης'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Πλήρες Όνομα"
              {...register('name', { required: 'Το όνομα είναι υποχρεωτικό' })}
              error={errors.name?.message}
              placeholder="π.χ. Μαρία Παπαδοπούλου"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Σχέση *
              </label>
              <Dropdown
                options={relationshipOptions}
                value={watch('relationship')}
                onChange={(value) => setValue('relationship', value as string)}
                placeholder="Επιλογή σχέσης"
                error={!!errors.relationship}
              />
              {errors.relationship && (
                <p className="mt-1 text-sm text-red-600">{errors.relationship.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Τηλέφωνο"
              {...register('phone', { required: 'Το τηλέφωνο είναι υποχρεωτικό' })}
              error={errors.phone?.message}
              placeholder="π.χ. 6987654321"
              required
            />

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="π.χ. maria@example.com"
            />
          </div>

          <Input
            label="Διεύθυνση"
            {...register('address')}
            error={errors.address?.message}
            placeholder="π.χ. Μεγάλου Αλεξάνδρου 123, Θεσσαλονίκη"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Σημειώσεις
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="form-textarea"
              placeholder="Πρόσθετες πληροφορίες..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('isPrimary')}
              onChange={(e) => handlePrimaryChange(e.target.checked)}
              className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label className="text-sm text-gray-700">
              Ορισμός ως κύρια επαφή έκτακτης ανάγκης
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingContact(null)
                reset()
              }}
            >
              Ακύρωση
            </Button>
            
            <Button
              type="submit"
              loading={createContactMutation.isLoading || updateContactMutation.isLoading}
              disabled={!isValid}
            >
              {editingContact ? 'Ενημέρωση' : 'Προσθήκη'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Διαγραφή Επαφής"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την επαφή έκτακτης ανάγκης;"
        confirmText="Διαγραφή"
        variant="error"
        loading={deleteContactMutation.isLoading}
      />
    </>
  )
}

export default EmergencyContacts