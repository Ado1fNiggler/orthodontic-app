import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Components
import Card, { CardHeader, CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Dropdown from '@components/common/Dropdown'
import DatePicker from '@components/common/DatePicker'
import LoadingSpinner from '@components/common/LoadingSpinner'

// Types
import { Patient, CreatePatientData, UpdatePatientData } from '@types/patient'

// Validation Schema
const patientSchema = z.object({
  name: z.string().min(2, 'Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες'),
  email: z.string().email('Μη έγκυρη διεύθυνση email'),
  phone: z.string().min(10, 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 10 ψηφία'),
  birthDate: z.date({ required_error: 'Η ημερομηνία γέννησης είναι υποχρεωτική' }),
  gender: z.enum(['male', 'female'], { required_error: 'Το φύλο είναι υποχρεωτικό' }),
  address: z.string().optional(),
  occupation: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional(),
  medicalHistory: z.object({
    allergies: z.string().optional(),
    medications: z.string().optional(),
    conditions: z.string().optional(),
    previousTreatments: z.string().optional()
  }).optional(),
  insurance: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    coverage: z.string().optional()
  }).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active')
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientFormProps {
  patient?: Patient
  onSubmit: (data: CreatePatientData | UpdatePatientData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'medical' | 'insurance'>('basic')
  const [submitLoading, setSubmitLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    reset
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      birthDate: new Date(patient.birthDate),
      gender: patient.gender,
      address: patient.address || '',
      occupation: patient.occupation || '',
      emergencyContact: patient.emergencyContact || {},
      medicalHistory: patient.medicalHistory || {},
      insurance: patient.insurance || {},
      notes: patient.notes || '',
      status: patient.status || 'active'
    } : {
      status: 'active'
    }
  })

  // Watch form values for auto-save (could be implemented)
  const watchedValues = watch()

  useEffect(() => {
    if (patient) {
      reset({
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: new Date(patient.birthDate),
        gender: patient.gender,
        address: patient.address || '',
        occupation: patient.occupation || '',
        emergencyContact: patient.emergencyContact || {},
        medicalHistory: patient.medicalHistory || {},
        insurance: patient.insurance || {},
        notes: patient.notes || '',
        status: patient.status || 'active'
      })
    }
  }, [patient, reset])

  const handleFormSubmit = async (data: PatientFormData) => {
    setSubmitLoading(true)
    try {
      await onSubmit(data)
      toast.success(patient ? 'Ο ασθενής ενημερώθηκε επιτυχώς' : 'Ο ασθενής δημιουργήθηκε επιτυχώς')
    } catch (error) {
      toast.error('Σφάλμα κατά την αποθήκευση')
      console.error('Form submission error:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const sections = [
    { id: 'basic', label: 'Βασικά Στοιχεία', required: true },
    { id: 'contact', label: 'Επικοινωνία', required: false },
    { id: 'medical', label: 'Ιατρικό Ιστορικό', required: false },
    { id: 'insurance', label: 'Ασφάλιση', required: false }
  ]

  const genderOptions = [
    { label: 'Άνδρας', value: 'male' },
    { label: 'Γυναίκα', value: 'female' }
  ]

  const statusOptions = [
    { label: 'Ενεργός', value: 'active' },
    { label: 'Ανενεργός', value: 'inactive' },
    { label: 'Αρχειοθετημένος', value: 'archived' }
  ]

  const relationshipOptions = [
    { label: 'Σύζυγος', value: 'spouse' },
    { label: 'Γονέας', value: 'parent' },
    { label: 'Παιδί', value: 'child' },
    { label: 'Αδελφός/ή', value: 'sibling' },
    { label: 'Φίλος/η', value: 'friend' },
    { label: 'Άλλο', value: 'other' }
  ]

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Section Navigation */}
      <Card>
        <CardBody padding="sm">
          <nav className="flex space-x-0" aria-label="Form sections">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id as any)}
                className={`${
                  activeSection === section.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                } flex-1 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                {section.label}
                {section.required && <span className="text-red-500 ml-1">*</span>}
              </button>
            ))}
          </nav>
        </CardBody>
      </Card>

      {/* Form Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'basic' && (
          <Card>
            <CardHeader title="Βασικά Στοιχεία" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Πλήρες Όνομα"
                    {...register('name')}
                    error={errors.name?.message}
                    required
                    placeholder="π.χ. Γιάννης Παπαδόπουλος"
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  required
                  placeholder="π.χ. giannis@example.com"
                />

                <Input
                  label="Τηλέφωνο"
                  {...register('phone')}
                  error={errors.phone?.message}
                  required
                  placeholder="π.χ. 6912345678"
                />

                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Ημερομηνία Γέννησης"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.birthDate?.message}
                      required
                      maxDate={new Date()}
                    />
                  )}
                />

                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Φύλο <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        options={genderOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Επιλογή φύλου"
                        error={!!errors.gender}
                      />
                      {errors.gender && (
                        <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                      )}
                    </div>
                  )}
                />

                <Input
                  label="Επάγγελμα"
                  {...register('occupation')}
                  error={errors.occupation?.message}
                  placeholder="π.χ. Δάσκαλος"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Διεύθυνση"
                    {...register('address')}
                    error={errors.address?.message}
                    placeholder="π.χ. Μεγάλου Αλεξάνδρου 123, Θεσσαλονίκη"
                  />
                </div>

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Κατάσταση
                      </label>
                      <Dropdown
                        options={statusOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Επιλογή κατάστασης"
                      />
                    </div>
                  )}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {activeSection === 'contact' && (
          <Card>
            <CardHeader title="Επικοινωνία Έκτακτης Ανάγκης" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Όνομα Επαφής"
                  {...register('emergencyContact.name')}
                  error={errors.emergencyContact?.name?.message}
                  placeholder="π.χ. Μαρία Παπαδοπούλου"
                />

                <Input
                  label="Τηλέφωνο Επαφής"
                  {...register('emergencyContact.phone')}
                  error={errors.emergencyContact?.phone?.message}
                  placeholder="π.χ. 6987654321"
                />

                <Controller
                  name="emergencyContact.relationship"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Σχέση
                      </label>
                      <Dropdown
                        options={relationshipOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Επιλογή σχέσης"
                      />
                    </div>
                  )}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {activeSection === 'medical' && (
          <Card>
            <CardHeader title="Ιατρικό Ιστορικό" />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Αλλεργίες
                  </label>
                  <textarea
                    {...register('medicalHistory.allergies')}
                    rows={3}
                    className="form-textarea"
                    placeholder="Περιγράψτε τυχόν αλλεργίες..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Φάρμακα
                  </label>
                  <textarea
                    {...register('medicalHistory.medications')}
                    rows={3}
                    className="form-textarea"
                    placeholder="Φάρμακα που λαμβάνει..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ιατρικές Καταστάσεις
                  </label>
                  <textarea
                    {...register('medicalHistory.conditions')}
                    rows={3}
                    className="form-textarea"
                    placeholder="Υπάρχουσες ιατρικές καταστάσεις..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Προηγούμενες Θεραπείες
                  </label>
                  <textarea
                    {...register('medicalHistory.previousTreatments')}
                    rows={3}
                    className="form-textarea"
                    placeholder="Προηγούμενες οδοντιατρικές θεραπείες..."
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeSection === 'insurance' && (
          <Card>
            <CardHeader title="Στοιχεία Ασφάλισης" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Ασφαλιστική Εταιρεία"
                  {...register('insurance.provider')}
                  error={errors.insurance?.provider?.message}
                  placeholder="π.χ. ΕΟΠΥΥ"
                />

                <Input
                  label="Αριθμός Πολιτικής"
                  {...register('insurance.policyNumber')}
                  error={errors.insurance?.policyNumber?.message}
                  placeholder="π.χ. 12345678"
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Κάλυψη
                  </label>
                  <textarea
                    {...register('insurance.coverage')}
                    rows={3}
                    className="form-textarea"
                    placeholder="Περιγραφή κάλυψης..."
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Notes Section (Always visible) */}
        <Card>
          <CardHeader title="Σημειώσεις" />
          <CardBody>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Γενικές Σημειώσεις
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="form-textarea"
                placeholder="Πρόσθετες σημειώσεις για τον ασθενή..."
              />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Form Actions */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isDirty && '* Υπάρχουν μη αποθηκευμένες αλλαγές'}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitLoading}
              >
                Ακύρωση
              </Button>
              
              <Button
                type="submit"
                loading={submitLoading || loading}
                disabled={!isValid}
              >
                {patient ? 'Ενημέρωση' : 'Δημιουργία'} Ασθενή
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </form>
  )
}

export default PatientForm