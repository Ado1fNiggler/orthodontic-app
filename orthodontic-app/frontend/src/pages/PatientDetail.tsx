import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  PencilIcon, 
  TrashIcon, 
  CameraIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

// Components
import Card, { CardHeader, CardBody, StatCard } from '@components/common/Card'
import Button from '@components/common/Button'
import Modal, { ConfirmModal } from '@components/common/Modal'
import LoadingSpinner from '@components/common/LoadingSpinner'
import MedicalHistory from '@components/patients/MedicalHistory'
import InsuranceInfo from '@components/patients/InsuranceInfo'
import EmergencyContacts from '@components/patients/EmergencyContacts'

// API & Types
import { patientApi } from '@api/patientApi'
import { appointmentApi } from '@api/appointmentApi'
import { treatmentApi } from '@api/treatmentApi'
import { Patient } from '@types/patient'

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'treatments' | 'appointments' | 'financial'>('overview')
  const [deleteModal, setDeleteModal] = useState(false)

  // API Queries
  const { 
    data: patient, 
    isLoading, 
    error 
  } = useQuery(
    ['patient', id],
    () => patientApi.getPatient(id!),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000
    }
  )

  const { data: appointments } = useQuery(
    ['patient-appointments', id],
    () => appointmentApi.getPatientAppointments(id!),
    {
      enabled: !!id
    }
  )

  const { data: treatments } = useQuery(
    ['patient-treatments', id],
    () => treatmentApi.getPatientTreatments(id!),
    {
      enabled: !!id
    }
  )

  const { data: stats } = useQuery(
    ['patient-stats', id],
    () => patientApi.getPatientStats(id!),
    {
      enabled: !!id
    }
  )

  // Mutations
  const deletePatientMutation = useMutation(
    () => patientApi.deletePatient(id!),
    {
      onSuccess: () => {
        toast.success('Ο ασθενής διαγράφηκε επιτυχώς')
        navigate('/patients')
      },
      onError: (error: any) => {
        toast.error('Σφάλμα κατά τη διαγραφή του ασθενή')
        console.error('Delete patient error:', error)
      }
    }
  )

  // Handlers
  const handleEdit = () => {
    navigate(`/patients/${id}/edit`)
  }

  const handleDelete = () => {
    setDeleteModal(true)
  }

  const confirmDelete = () => {
    deletePatientMutation.mutate()
  }

  const handleTakePhoto = () => {
    navigate(`/camera?patientId=${id}`)
  }

  const handleScheduleAppointment = () => {
    navigate(`/calendar/new?patientId=${id}`)
  }

  const handleAddTreatment = () => {
    navigate(`/treatments/new?patientId=${id}`)
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const tabs = [
    { id: 'overview', label: 'Επισκόπηση', icon: UserIcon },
    { id: 'medical', label: 'Ιατρικό Ιστορικό', icon: HeartIcon },
    { id: 'treatments', label: 'Θεραπείες', icon: DocumentTextIcon },
    { id: 'appointments', label: 'Ραντεβού', icon: CalendarDaysIcon },
    { id: 'financial', label: 'Οικονομικά', icon: CurrencyEuroIcon }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Φόρτωση στοιχείων ασθενή..." />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Σφάλμα κατά τη φόρτωση του ασθενή</div>
        <Button onClick={() => navigate('/patients')}>
          Επιστροφή στους Ασθενείς
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between"
      >
        {/* Patient Info */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {patient.avatar ? (
              <img
                className="h-20 w-20 rounded-full"
                src={patient.avatar}
                alt={patient.name}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-gray-600">
                <span className="text-sm">
                  {calculateAge(patient.birthDate)} ετών • 
                  {patient.gender === 'male' ? ' Άνδρας' : ' Γυναίκα'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  {patient.phone}
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  {patient.email}
                </div>
              </div>
              
              {patient.address && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {patient.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={handleScheduleAppointment}
            leftIcon={<CalendarDaysIcon />}
          >
            Νέο Ραντεβού
          </Button>
          
          <Button
            variant="outline"
            onClick={handleTakePhoto}
            leftIcon={<CameraIcon />}
          >
            Φωτογραφία
          </Button>
          
          <Button
            variant="outline"
            onClick={handleEdit}
            leftIcon={<PencilIcon />}
          >
            Επεξεργασία
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDelete}
            leftIcon={<TrashIcon />}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Διαγραφή
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatCard
            title="Συνολικές Επισκέψεις"
            value={stats.totalAppointments}
            icon={<CalendarDaysIcon />}
            color="primary"
          />
          
          <StatCard
            title="Ενεργές Θεραπείες"
            value={stats.activeTreatments}
            icon={<DocumentTextIcon />}
            color="success"
          />
          
          <StatCard
            title="Υπόλοιπο Οφειλής"
            value={`€${stats.outstandingBalance}`}
            icon={<CurrencyEuroIcon />}
            color={stats.outstandingBalance > 0 ? "warning" : "success"}
          />
          
          <StatCard
            title="Τελευταία Επίσκεψη"
            value={patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('el-GR') : 'Ποτέ'}
            icon={<ClockIcon />}
            color="primary"
          />
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardBody padding="none">
            <nav className="flex space-x-0" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } flex-1 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader title="Βασικά Στοιχεία" />
              <CardBody>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ημερομηνία Γέννησης</dt>
                    <dd className="text-sm text-gray-900">{new Date(patient.birthDate).toLocaleDateString('el-GR')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Φύλο</dt>
                    <dd className="text-sm text-gray-900">{patient.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Επάγγελμα</dt>
                    <dd className="text-sm text-gray-900">{patient.occupation || 'Δεν έχει καταχωρηθεί'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ημερομηνία Εγγραφής</dt>
                    <dd className="text-sm text-gray-900">{new Date(patient.createdAt).toLocaleDateString('el-GR')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Κατάσταση</dt>
                    <dd>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        patient.status === 'active' ? 'bg-green-100 text-green-800' :
                        patient.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {patient.status === 'active' ? 'Ενεργός' :
                         patient.status === 'inactive' ? 'Ανενεργός' : 'Αρχειοθετημένος'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            {/* Emergency Contacts */}
            <EmergencyContacts patientId={patient.id} />
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MedicalHistory patientId={patient.id} />
            <InsuranceInfo patientId={patient.id} />
          </div>
        )}

        {activeTab === 'treatments' && (
          <Card>
            <CardHeader 
              title="Θεραπείες" 
              extra={
                <Button
                  size="sm"
                  onClick={handleAddTreatment}
                  leftIcon={<DocumentTextIcon />}
                >
                  Νέα Θεραπεία
                </Button>
              }
            />
            <CardBody>
              {treatments && treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.map((treatment: any) => (
                    <div
                      key={treatment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/treatments/${treatment.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{treatment.name}</h4>
                          <p className="text-sm text-gray-500">{treatment.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            treatment.status === 'active' ? 'bg-green-100 text-green-800' :
                            treatment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            treatment.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {treatment.status === 'active' ? 'Ενεργή' :
                             treatment.status === 'completed' ? 'Ολοκληρωμένη' :
                             treatment.status === 'paused' ? 'Παύση' : 'Δεν ξεκίνησε'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(treatment.startDate).toLocaleDateString('el-GR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Δεν υπάρχουν θεραπείες</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'appointments' && (
          <Card>
            <CardHeader 
              title="Ραντεβού" 
              extra={
                <Button
                  size="sm"
                  onClick={handleScheduleAppointment}
                  leftIcon={<CalendarDaysIcon />}
                >
                  Νέο Ραντεβού
                </Button>
              }
            />
            <CardBody>
              {appointments && appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/calendar/${appointment.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{appointment.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.datetime).toLocaleString('el-GR')}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Επιβεβαιωμένο' :
                             appointment.status === 'pending' ? 'Εκκρεμεί' :
                             appointment.status === 'cancelled' ? 'Ακυρωμένο' : 'Ολοκληρωμένο'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {appointment.duration} λεπτά
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Δεν υπάρχουν ραντεβού</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader title="Οικονομική Κατάσταση" />
              <CardBody>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Συνολικό Κόστος</dt>
                    <dd className="text-sm text-gray-900">€{stats?.totalCost || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Πληρωμένο</dt>
                    <dd className="text-sm text-green-600">€{stats?.totalPaid || 0}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <dt className="text-sm font-medium text-gray-900">Υπόλοιπο</dt>
                    <dd className={`text-sm font-medium ${
                      (stats?.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      €{stats?.outstandingBalance || 0}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader title="Πρόσφατες Πληρωμές" />
              <CardBody>
                <div className="space-y-3">
                  {stats?.recentPayments?.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="text-sm font-medium text-gray-900">€{payment.amount}</div>
                        <div className="text-xs text-gray-500">{payment.method}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.date).toLocaleDateString('el-GR')}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      <CurrencyEuroIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Δεν υπάρχουν πληρωμές</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Διαγραφή Ασθενή"
        message={`Είστε σίγουροι ότι θέλετε να διαγράψετε τον ασθενή "${patient.name}"; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί και θα διαγραφούν όλα τα σχετικά δεδομένα.`}
        confirmText="Διαγραφή"
        variant="error"
        loading={deletePatientMutation.isLoading}
      />
    </div>
  )
}

export default PatientDetail